import { Context } from 'elysia'
import {
  genTimestamp,
  getDatabaseConnection,
  jsonResponse
} from '../../../lib/util'
import { berryDashUserData, users } from '../../../lib/tables'
import { eq, sql } from 'drizzle-orm'
import { calculateXP } from '../../../lib/bd'

export const handler = async (context: Context) => {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database', data: null },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo0
  const { connection: connection1, db: db1 } = dbInfo1

  const usernameToSearch = context.query.username

  const userRows = await db0
    .select({
      id: users.id,
      username: users.username,
      registerTime: users.registerTime
    })
    .from(users)
    .where(
      sql`LOWER(${
        users.username
      }) LIKE ${`%${usernameToSearch.toLowerCase()}%`}`
    )
    .execute()

  const result = await Promise.all(
    userRows.map(async (row: any) => {
      const userData = await db1
        .select({ saveData: berryDashUserData.saveData })
        .from(berryDashUserData)
        .where(eq(berryDashUserData.id, row.id))
        .execute()
      const savedata = JSON.parse(userData[0].saveData)
      row.memberFor = genTimestamp(row.registerTime, 2)
      delete row.registerTime
      row.icon = savedata?.bird?.icon ?? 1
      row.overlay = savedata?.bird?.overlay ?? 0
      row.birdColor = savedata?.settings?.colors?.icon ?? [255, 255, 255]
      row.overlayColor = savedata?.settings?.colors?.overlay ?? [255, 255, 255]
      row.customIcon = savedata?.bird?.customIcon?.selected ?? null
      row.stats = {
        highScore: BigInt(savedata?.gameStore?.highScore ?? 0).toString(),
        totalNormalBerries: BigInt(
          savedata?.gameStore?.totalNormalBerries ?? 0
        ).toString(),
        totalPoisonBerries: BigInt(
          savedata?.gameStore?.totalPoisonBerries ?? 0
        ).toString(),
        totalSlowBerries: BigInt(
          savedata?.gameStore?.totalSlowBerries ?? 0
        ).toString(),
        totalUltraBerries: BigInt(
          savedata?.gameStore?.totalUltraBerries ?? 0
        ).toString(),
        totalSpeedyBerries: BigInt(
          savedata?.gameStore?.totalSpeedyBerries ?? 0
        ).toString(),
        totalCoinBerries: BigInt(
          savedata?.gameStore?.totalCoinBerries ?? 0
        ).toString(),
        totalRandomBerries: BigInt(
          savedata?.gameStore?.totalRandomBerries ?? 0
        ).toString(),
        totalAntiBerries: BigInt(
          savedata?.gameStore?.totalAntiBerries ?? 0
        ).toString(),
        xp: calculateXP(
          BigInt(savedata?.gameStore?.totalNormalBerries ?? 0),
          BigInt(savedata?.gameStore?.totalPoisonBerries ?? 0),
          BigInt(savedata?.gameStore?.totalSlowBerries ?? 0),
          BigInt(savedata?.gameStore?.totalUltraBerries ?? 0),
          BigInt(savedata?.gameStore?.totalSpeedyBerries ?? 0),
          BigInt(savedata?.gameStore?.totalCoinBerries ?? 0)
        ).toString(),
        coins: BigInt(savedata?.bird?.customIcon?.balance ?? 0).toString()
      }
      return row
    })
  )

  connection0.end()
  connection1.end()

  return jsonResponse({ success: true, message: null, data: result }, 200)
}
