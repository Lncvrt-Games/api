import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse
} from '../../../../lib/util'
import { checkAuthorization } from '../../../../lib/auth'
import { berryDashUserData } from '../../../../lib/tables'
import { eq } from 'drizzle-orm'

type Body = {
  saveData: string
}

export async function handler (context: Context) {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database' },
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
    return jsonResponse({ success: false, message: 'Unauthorized' }, 401)
  }
  const userId = authResult.id

  const body = context.body as Body
  if (!body.saveData) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'No valid save data provided' },
      400
    )
  }

  let userSaveData: any = {}
  try {
    userSaveData = JSON.parse(atob(body.saveData))
    if (!userSaveData.account) userSaveData.account = {}
    userSaveData.account.id = null
    userSaveData.account.name = null
    userSaveData.account.session = null
  } catch {
    return jsonResponse(
      { success: false, message: "Couldn't parse save data" },
      400
    )
  }

  await db1
    .update(berryDashUserData)
    .set({ saveData: JSON.stringify(userSaveData) })
    .where(eq(berryDashUserData.id, userId))
    .execute()

  return jsonResponse({ success: true, message: null })
}
