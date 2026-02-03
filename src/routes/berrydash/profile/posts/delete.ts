import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse
} from '../../../../lib/util'
import { berryDashUserPosts } from '../../../../lib/tables'
import { and, eq } from 'drizzle-orm'
import { checkAuthorization } from '../../../../lib/auth'

export async function handler (context: Context) {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database', data: null },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo1
  const { connection: connection1, db: db1 } = dbInfo1

  const ip = getClientIp(context)
  const authorizationToken = context.headers.authorization
  const authResult = await checkAuthorization(
    authorizationToken as string,
    db0,
    ip
  )
  if (!authResult.valid) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'Unauthorized', data: null },
      401
    )
  }
  const userId = authResult.id

  let idQuery = context.query.id ? parseInt(context.query.id, 10) : 0

  const result = await db1
    .update(berryDashUserPosts)
    .set({ deletedAt: Math.floor(Date.now() / 1000) })
    .where(
      and(
        eq(berryDashUserPosts.id, idQuery),
        eq(berryDashUserPosts.userId, userId),
        eq(berryDashUserPosts.deletedAt, 0)
      )
    )
    .execute()

  connection0.end()
  connection1.end()

  if (result[0])
    return jsonResponse({ success: true, message: null, data: null }, 200)
  else return jsonResponse({ success: false, message: null, data: null }, 400)
}
