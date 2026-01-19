import { Context } from 'elysia'
import {
  genTimestamp,
  getDatabaseConnection,
  jsonResponse
} from '../../../../lib/util'
import {
  berryDashUserData,
  berryDashUserPosts,
  users
} from '../../../../lib/tables'
import { and, desc, eq } from 'drizzle-orm'

export async function handler (context: Context) {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database', data: null },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo0
  const { connection: connection1, db: db1 } = dbInfo1

  let authorizationToken = context.headers.authorization
  let idQuery = context.query.id ? parseInt(context.query.id, 10) : 0
  if (!idQuery || idQuery < 1) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'No valid post ID provided', data: null },
      400
    )
  }
  if (!authorizationToken) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'Unauthorized', data: null },
      401
    )
  }

  const userData = await db1
    .select({ id: berryDashUserData.id })
    .from(berryDashUserData)
    .where(eq(berryDashUserData.token, authorizationToken))
    .execute()

  if (!userData[0]) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'Unauthorized', data: null },
      401
    )
  }

  const result = await db1
    .update(berryDashUserPosts)
    .set({ deletedAt: Math.floor(Date.now() / 1000) })
    .where(
      and(
        eq(berryDashUserPosts.id, idQuery),
        eq(berryDashUserPosts.userId, userData[0].id),
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
