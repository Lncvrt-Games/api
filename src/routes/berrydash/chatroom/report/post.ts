import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse
} from '../../../../lib/util'
import { berryDashChatroomReports } from '../../../../lib/tables'
import { checkAuthorization } from '../../../../lib/bd/auth'
import { and, eq } from 'drizzle-orm'

type Body = {
  id: string
  reason: string
}

export async function handler (context: Context) {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database' },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo1
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
  const id = parseInt(body.id, 10)
  if (isNaN(id)) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'No valid ID provided' },
      400
    )
  }

  const result = await db1
    .select()
    .from(berryDashChatroomReports)
    .where(
      and(
        eq(berryDashChatroomReports.chatId, id),
        eq(berryDashChatroomReports.userId, userId)
      )
    )
    .execute()
  if (result[0]) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'You already reported this message' },
      400
    )
  }

  await db1
    .insert(berryDashChatroomReports)
    .values({
      chatId: id,
      userId,
      reason: btoa(body.reason),
      timestamp: Math.floor(Date.now() / 1000)
    })
    .execute()

  connection0.end()
  connection1.end()

  return jsonResponse({ success: true, message: null }, 200)
}
