import { Context } from 'elysia'
import { getDatabaseConnection, jsonResponse } from '../../../../lib/util'
import { berryDashUserPosts } from '../../../../lib/tables'
import { and, eq } from 'drizzle-orm'
import { checkAuthorization } from '../../../../lib/bd/auth'

export async function handler (context: Context) {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database', data: null },
      500
    )
  const { connection: connection1, db: db1 } = dbInfo1

  const authorizationToken = context.headers.authorization
  const authResult = await checkAuthorization(authorizationToken as string, db1)
  if (!authResult.valid) {
    connection1.end()
    return jsonResponse(
      { success: false, message: 'Unauthorized', data: null },
      401
    )
  }
  const userId = authResult.id

  let idQuery = context.query.id ? parseInt(context.query.id, 10) : 0
  if (!idQuery || idQuery < 1) {
    connection1.end()
    return jsonResponse(
      { success: false, message: 'No valid post ID provided', data: null },
      400
    )
  }

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

  connection1.end()

  if (result[0])
    return jsonResponse({ success: true, message: null, data: null }, 200)
  else return jsonResponse({ success: false, message: null, data: null }, 400)
}
