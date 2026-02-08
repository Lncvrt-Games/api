import { Context } from 'elysia'
import { getDatabaseConnection, jsonResponse } from '../../../lib/util'
import { berryDashUserData, users } from '../../../lib/tables'
import { eq, sql } from 'drizzle-orm'

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
    .select({ id: users.id, username: users.username })
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
      row.icon = savedata?.bird?.icon ?? 1
      row.overlay = savedata?.bird?.overlay ?? 0
      row.birdColor = savedata?.settings?.colors?.icon ?? [255, 255, 255]
      row.overlayColor = savedata?.settings?.colors?.overlay ?? [255, 255, 255]
      row.customIcon = savedata?.bird?.customIcon?.selected ?? null
      row.stats = {
        highScore: parseInt(savedata?.gameStore?.highScore ?? 0),
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
        coins: savedata?.bird?.customIcon?.balance ?? 0
      }
      return row
    })
  )

  connection0.end()
  connection1.end()

  return jsonResponse({ success: true, message: null, data: result }, 200)
}
