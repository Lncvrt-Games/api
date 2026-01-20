import { Context } from 'elysia'
import { getDatabaseConnection, jsonResponse } from '../../../../lib/util'
import { berryDashUserData, berryDashUserPosts } from '../../../../lib/tables'
import { eq } from 'drizzle-orm'

type Body = {
  content: string
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
  const body = context.body as Body
  if (!body.content) {
    connection1.end()
    return jsonResponse(
      { success: false, message: 'No valid content provided', data: null },
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

  await db1
    .insert(berryDashUserPosts)
    .values({
      userId: userData[0].id,
      content: btoa(body.content),
      timestamp: Math.floor(Date.now() / 1000)
    })
    .execute()

  connection1.end()

  return jsonResponse({ success: true, message: null, data: null }, 200)
}
