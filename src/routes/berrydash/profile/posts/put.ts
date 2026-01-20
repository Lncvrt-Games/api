import { Context } from 'elysia'
import { getDatabaseConnection, jsonResponse } from '../../../../lib/util'
import { berryDashUserData, berryDashUserPosts } from '../../../../lib/tables'
import { and, eq } from 'drizzle-orm'

type Body = {
  liked: string
}

export async function handler (context: Context) {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database', data: null },
      500
    )
  const { connection: connection1, db: db1 } = dbInfo1

  let authorizationToken = context.headers.authorization
  let idQuery = context.query.id ? parseInt(context.query.id, 10) : 0
  let likedQuery = context.query.liked as string
  if (!idQuery || idQuery < 1) {
    connection1.end()
    return jsonResponse(
      { success: false, message: 'No valid post ID provided', data: null },
      400
    )
  }
  if (
    !likedQuery ||
    (likedQuery.toLowerCase() != 'true' && likedQuery.toLowerCase() != 'false')
  ) {
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Missing or invalid liked value',
        data: null
      },
      400
    )
  }
  if (!authorizationToken) {
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
    connection1.end()
    return jsonResponse(
      { success: false, message: 'Unauthorized', data: null },
      401
    )
  }

  const votesResult = await db1
    .select({ votes: berryDashUserPosts.votes })
    .from(berryDashUserPosts)
    .where(
      and(
        eq(berryDashUserPosts.id, idQuery),
        eq(berryDashUserPosts.deletedAt, 0)
      )
    )
    .limit(1)
    .execute()
  if (!votesResult[0])
    return jsonResponse(
      {
        success: true,
        message: 'Unable to get information on post',
        data: null
      },
      400
    )
  const votes = JSON.parse(votesResult[0].votes)
  if (votes[userData[0].id.toString()]) {
    let likes = 0
    for (const vote of Object.values(votes) as boolean[]) likes += vote ? 1 : -1
    return jsonResponse({ success: true, message: null, data: { likes } }, 200)
  }
  votes[userData[0].id.toString()] = likedQuery.toLowerCase() == 'true'

  await db1
    .update(berryDashUserPosts)
    .set({ votes: JSON.stringify(votes) })
    .where(
      and(
        eq(berryDashUserPosts.id, idQuery),
        eq(berryDashUserPosts.deletedAt, 0)
      )
    )
    .execute()

  connection1.end()

  let likes = 0
  for (const vote of Object.values(votes) as boolean[]) likes += vote ? 1 : -1
  return jsonResponse({ success: true, message: null, data: { likes } }, 200)
}
