import { Context } from 'elysia'
import { getDatabaseConnection, jsonResponse } from '../../../lib/util'
import { berryDashUserData, users } from '../../../lib/tables'
import { eq } from 'drizzle-orm'

export const handler = async (context: Context, type: number) => {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database', data: null },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo0
  const { connection: connection1, db: db1 } = dbInfo1

  let request_value = ''
  if (type == 0) {
    request_value = 'highScore'
  } else if (type == 1) {
    let berryQuery = context.query.berry ? parseInt(context.query.berry, 10) : 0
    switch (berryQuery) {
      case 1:
        request_value = 'totalPoisonBerries'
        break
      case 2:
        request_value = 'totalSlowBerries'
        break
      case 3:
        request_value = 'totalUltraBerries'
        break
      case 4:
        request_value = 'totalSpeedyBerries'
        break
      case 5:
        request_value = 'totalCoinBerries'
        break
      case 6:
        request_value = 'totalRandomBerries'
        break
      case 7:
        request_value = 'totalAntiBerries'
        break
      case 8:
        request_value = 'totalGoldenBerries'
        break
      default:
        request_value = 'totalNormalBerries'
        break
    }
  } else if (type != 2 && type != 3 && type != 4) {
    connection0.end()
    connection1.end()
    return jsonResponse({ success: false, message: 'Invalid Type', data: null })
  }

  const userList = await db0
    .select({
      username: users.username,
      id: users.id
    })
    .from(users)
    .where(eq(users.leaderboardsBanned, false))
    .execute()
  const userDataList = await db1
    .select({
      id: berryDashUserData.id,
      saveData: berryDashUserData.saveData,
      legacyHighScore: berryDashUserData.legacyHighScore
    })
    .from(berryDashUserData)
    .execute()
  const completeUserList = userList.map(user => {
    const data = userDataList.find(d => d.id === user.id)
    return {
      ...user,
      ...(data ? data : {})
    }
  })

  let mapped = []
  for (const row of completeUserList) {
    const savedata = row.saveData ? JSON.parse(row.saveData) : null
    if (!savedata) continue

    let value = 0
    if (type === 4) {
      const berries = [
        'totalNormalBerries',
        'totalPoisonBerries',
        'totalSlowBerries',
        'totalUltraBerries',
        'totalSpeedyBerries',
        'totalCoinBerries',
        'totalRandomBerries',
        'totalAntiBerries',
        'totalGoldenBerries'
      ]
      value = berries.reduce(
        (acc, b) => acc + parseInt(savedata.gameStore?.[b] ?? 0, 10),
        0
      )
    } else if (type === 2) {
      value = parseInt(savedata.bird?.customIcon?.balance ?? 0, 10)
    } else if (type === 3) {
      value = parseInt(String(row.legacyHighScore ?? 0), 10)
    } else {
      value = parseInt(savedata.gameStore?.[request_value] ?? 0, 10)
    }
    if (value <= 0) continue

    const customIcon = savedata.bird?.customIcon?.selected ?? null

    mapped.push({
      id: row.id,
      username: row.username,
      value,
      icon: customIcon ? 1 : savedata.bird?.icon ?? 1,
      overlay: customIcon ? 0 : savedata.bird?.overlay ?? 0,
      birdColor: customIcon
        ? [255, 255, 255]
        : savedata.settings?.colors?.icon ?? [255, 255, 255],
      overlayColor: customIcon
        ? [255, 255, 255]
        : savedata.settings?.colors?.overlay ?? [255, 255, 255],
      customIcon
    })
  }

  connection0.end()
  connection1.end()

  return jsonResponse({
    success: true,
    message: null,
    data: mapped.sort((a, b) => b.value - a.value)
  })
}
