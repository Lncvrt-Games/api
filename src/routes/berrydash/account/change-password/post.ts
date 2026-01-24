import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse
} from '../../../../lib/util'
import { checkAuthorization } from '../../../../lib/bd/auth'
import { users } from '../../../../lib/tables'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

type Body = {
  newPassword: string
}

export async function handler (context: Context) {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database' },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo0
  const { connection: connection1, db: db1 } = dbInfo1

  const ip = getClientIp(context)
  const authorizationToken = context.headers.authorization
  const authResult = await checkAuthorization(
    authorizationToken as string,
    db1,
    db0,
    ip
  )
  if (!authResult.valid) {
    connection0.end()
    connection1.end()
    return jsonResponse({ success: false, message: 'Unauthorized' }, 401)
  }
  const userId = authResult.id

  const body = context.body as Body
  if (!body.newPassword) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'No new password provided' },
      400
    )
  }

  if (
    !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_\-+=]{8,}$/.test(
      body.newPassword
    )
  ) {
    connection0.end()
    connection1.end()
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

  await db0
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, userId))
    .execute()

  return jsonResponse({ success: true, message: null })
}
