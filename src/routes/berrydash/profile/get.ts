import { Context } from 'elysia'
import {
  genTimestamp,
  getDatabaseConnection,
  jsonResponse
} from '../../../lib/util'
import { berryDashUserData, users } from '../../../lib/tables'
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

  let userIdQuery = context.query.userId
    ? parseInt(context.query.userId, 10)
    : 0
  if (!userIdQuery || userIdQuery < 1) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'No valid user ID provided', data: null },
      400
    )
  }

  const user = await db0
    .select({
      id: users.id,
      username: users.username,
      registerTime: users.registerTime
    })
    .from(users)
    .where(eq(users.id, userIdQuery))
    .execute()

  if (!user[0]) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'User does not exist', data: null },
      404
    )
  }

  const userData = await db1
    .select({
      id: berryDashUserData.id,
      saveData: berryDashUserData.saveData
    })
    .from(berryDashUserData)
    .where(and(eq(berryDashUserData.id, user[0].id)))
    .execute()
  const savedata = userData[0].saveData
    ? JSON.parse(userData[0].saveData)
    : null
  if (!savedata)
    return jsonResponse(
      { success: false, message: 'User save does not exist', data: null },
      404
    )

  connection0.end()
  connection1.end()

  const customIcon = savedata.bird?.customIcon?.selected ?? null

  return jsonResponse({
    success: true,
    message: null,
    data: {
      username: user[0].username,
      memberFor: genTimestamp(user[0].registerTime, 2),
      icon: customIcon ? null : savedata?.icon ?? 1,
      overlay: customIcon ? null : savedata?.overlay ?? 0,
      iconColor: customIcon
        ? null
        : savedata?.settings?.colors?.icon ?? [255, 255, 255],
      overlayColor: customIcon
        ? null
        : savedata?.settings?.colors?.overlay ?? [255, 255, 255],
      customIcon: customIcon,
      stats: {
        totalNormalBerries: parseInt(
          savedata?.gameStore?.totalNormalBerries ?? 0
        ),
        totalPoisonBerries: parseInt(
          savedata?.gameStore?.totalPoisonBerries ?? 0
        ),
        totalSlowBerries: parseInt(savedata?.gameStore?.totalSlowBerries ?? 0),
        totalUltraBerries: parseInt(
          savedata?.gameStore?.totalUltraBerries ?? 0
        ),
        totalSpeedyBerries: parseInt(
          savedata?.gameStore?.totalSpeedyBerries ?? 0
        ),
        totalCoinBerries: parseInt(savedata?.gameStore?.totalCoinBerries ?? 0),
        totalRandomBerries: parseInt(
          savedata?.gameStore?.totalRandomBerries ?? 0
        ),
        totalAntiBerries: parseInt(savedata?.gameStore?.totalAntiBerries ?? 0),
        coins: parseInt(savedata?.bird?.customIcon?.balance ?? 0)
      }
    }
  })
}
