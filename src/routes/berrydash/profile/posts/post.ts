import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse
} from '../../../../lib/util'
import { berryDashUserPosts } from '../../../../lib/tables'
import { checkAuthorization } from '../../../../lib/auth'

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

  const body = context.body as Body

  await db1
    .insert(berryDashUserPosts)
    .values({
      userId: userId,
      content: btoa(body.content),
      timestamp: Math.floor(Date.now() / 1000)
    })
    .execute()

  connection0.end()
  connection1.end()

  return jsonResponse({ success: true, message: null, data: null }, 200)
}
