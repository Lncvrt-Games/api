import { Context } from 'elysia'
import { getDatabaseConnection, jsonResponse } from '../../../../lib/util'
import { berryDashUserPosts, users } from '../../../../lib/tables'
import { and, eq } from 'drizzle-orm'

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

  let idQuery = context.query.id ? parseInt(context.query.id, 10) : 0
  if (!idQuery || idQuery < 1) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'No valid user ID provided', data: null },
      400
    )
  }

  const user = await db0
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, idQuery))
    .execute()

  if (!user[0]) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'User does not exist', data: null },
      404
    )
  }

  const userPosts = await db1
    .select({
      id: berryDashUserPosts.id,
      content: berryDashUserPosts.content,
      timestamp: berryDashUserPosts.timestamp,
      votes: berryDashUserPosts.votes
    })
    .from(berryDashUserPosts)
    .where(
      and(
        eq(berryDashUserPosts.userId, user[0].id),
        eq(berryDashUserPosts.deletedAt, 0)
      )
    )
    .execute()

  const result = {} as Record<number, {}>
  for (const userPost of userPosts) {
    let likes = 0
    for (const vote of Object.values(JSON.parse(userPost.votes)) as boolean[])
      likes += vote ? 1 : -1

    result[userPost.id] = {
      content: btoa(userPost.content),
      timestamp: 'n/a',
      likes: likes
    }
  }

  connection0.end()
  connection1.end()

  return result
}
