import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse
} from '../../../../lib/util'
import { checkAuthorization } from '../../../../lib/auth'
import { berryDashUserData, users } from '../../../../lib/tables'
import { eq } from 'drizzle-orm'

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

  const result = await db1
    .select({
      saveData: berryDashUserData.saveData
    })
    .from(berryDashUserData)
    .where(eq(berryDashUserData.id, userId))
    .execute()
  const result2 = await db0
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .execute()

  connection0.end()
  connection1.end()

  if (!result || !result)
    return jsonResponse(
      { success: false, message: 'Unauthorized', data: null },
      401
    )

  let savedata = JSON.parse(result[0].saveData)
  if (!savedata.account) savedata.account = {}
  savedata.account.id = userId
  savedata.account.name = result2[0].username
  savedata.account.session = authorizationToken
  return jsonResponse({ success: true, message: null, data: savedata }, 200)
}
