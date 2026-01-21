import { Context } from 'elysia'
import { getDatabaseConnection, jsonResponse } from '../../../../lib/util'
import { berryDashUserPosts } from '../../../../lib/tables'
import { checkAuthorization } from '../../../../lib/bd/auth'

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

  const authorizationToken = context.headers.authorizationToken
  const authResult = await checkAuthorization(authorizationToken as string, db1)
  if (!authResult.valid) {
    connection1.end()
    return jsonResponse(
      { success: false, message: 'Unauthorized', data: null },
      401
    )
  }
  const userId = authResult.id

  const body = context.body as Body
  if (!body.content) {
    connection1.end()
    return jsonResponse(
      { success: false, message: 'No valid content provided', data: null },
      400
    )
  }

  await db1
    .insert(berryDashUserPosts)
    .values({
      userId: userId,
      content: btoa(body.content),
      timestamp: Math.floor(Date.now() / 1000)
    })
    .execute()

  connection1.end()

  return jsonResponse({ success: true, message: null, data: null }, 200)
}
