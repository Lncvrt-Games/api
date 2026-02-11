import { Context } from 'elysia'
import {
  genTimestamp,
  getDatabaseConnection,
  jsonResponse
} from '../../../lib/util'
import { berryDashUserData, users } from '../../../lib/tables'
import { eq, sql } from 'drizzle-orm'
import { isDataURI } from 'validator'

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
  const idToSearch = Number(context.query.id ?? '0')
  const exactSearch = context.query.exact ?? ''.toLowerCase() == 'true'
  if (!usernameToSearch && !(idToSearch > 0 && exactSearch)) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message:
          'Either `username`, or `id` and `exact=true` params are required',
        data: null
      },
      400
    )
  }

  const userRows = await db0
    .select({
      id: users.id,
      username: users.username,
      registerTime: users.registerTime
    })
    .from(users)
    .where(
      idToSearch > 0 && exactSearch
        ? eq(users.id, idToSearch)
        : sql`LOWER(${
            users.username
          }) LIKE ${`%${usernameToSearch.toLowerCase()}%`}`
    )
    .limit(idToSearch > 0 && exactSearch ? 1 : 100)
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
        totalGoldenBerries: BigInt(
          savedata?.gameStore?.totalGoldenBerries ?? 0
        ).toString(),
        coins: BigInt(savedata?.bird?.customIcon?.balance ?? 0).toString()
      }
      return row
    })
  )

  connection0.end()
  connection1.end()

  return jsonResponse(
    {
      success: true,
      message: null,
      data: idToSearch > 0 && exactSearch ? result[0] : result
    },
    200
  )
}
