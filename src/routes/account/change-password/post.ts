import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse
} from '../../../lib/util'
import { checkAuthorization } from '../../../lib/auth'
import { users } from '../../../lib/tables'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

type Body = {
  newPassword: string
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

  if (
    !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_\-+=]{8,}$/.test(
      body.newPassword
    )
  ) {
    connection0.end()
    return jsonResponse(
      {
        success: false,
        message:
          'New password must be at least 8 characters with at least one letter and one number',
        data: null
      },
      400
    )
  }

  const hashedPassword = await bcrypt.hash(body.newPassword, 10)
  const token = randomBytes(256).toString('hex')

  await db0
    .update(users)
    .set({ password: hashedPassword, token })
    .where(eq(users.id, userId))
    .execute()

  connection0.end()

  return jsonResponse({ success: true, message: null, data: token })
}
