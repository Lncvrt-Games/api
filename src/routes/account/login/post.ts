import { Context } from 'elysia'
import { getDatabaseConnection, jsonResponse } from '../../../lib/util'
import { users } from '../../../lib/tables'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

type Body = {
  username: string
  password: string
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

  const body = context.body as Body

  const user = await db0
    .select({
      id: users.id,
      username: users.username,
      password: users.password,
      token: users.token
    })
    .from(users)
    .where(eq(users.username, body.username))
    .limit(1)
    .execute()

  connection0.end()

  if (!user[0])
    return jsonResponse(
      {
        success: false,
        message: 'Invalid username or password',
        data: null
      },
      401
    )
  if (!(await bcrypt.compare(body.password, user[0].password)))
    return jsonResponse(
      {
        success: false,
        message: 'Invalid username or password',
        data: null
      },
      401
    )

  return jsonResponse({
    success: true,
    message: null,
    data: {
      session: user[0].token,
      username: user[0].username,
      id: user[0].id
    }
  })
}
