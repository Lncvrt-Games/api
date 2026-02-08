import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse
} from '../../../lib/util'
import { checkAuthorization } from '../../../lib/auth'
import { users } from '../../../lib/tables'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'

type Body = {
  newUsername: string
}

export const handler = async (context: Context) => {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database', data: null },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo0

  const ip = getClientIp(context)
  const authorizationToken = context.headers.authorization
  const authResult = await checkAuthorization(
    authorizationToken as string,
    db0,
    ip
  )
  if (!authResult.valid) {
    connection0.end()
    return jsonResponse(
      { success: false, message: 'Unauthorized', data: null },
      401
    )
  }
  const userId = authResult.id

  const body = context.body as Body

  if (!/^[a-zA-Z0-9]{3,16}$/.test(body.newUsername)) {
    connection0.end()
    return jsonResponse(
      {
        success: false,
        message:
          'New username must be 3-16 characters, letters and numbers only',
        data: null
      },
      400
    )
  }

  const token = randomBytes(256).toString('hex')

  await db0
    .update(users)
    .set({ username: body.newUsername, token })
    .where(eq(users.id, userId))
    .execute()

  connection0.end()

  return jsonResponse({ success: true, message: null, data: token })
}
