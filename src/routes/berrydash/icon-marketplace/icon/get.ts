import { Context } from 'elysia'
import { getDatabaseConnection, jsonResponse } from '../../../../lib/util'
import { berryDashMarketplaceIcons, users } from '../../../../lib/tables'
import { eq, inArray } from 'drizzle-orm'

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

  let dataQuery = context.query.data
  let idQuery = context.query.id
  let idsQuery: string | string[] = context.query.ids
  if (!idQuery && !idsQuery) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Must have UUID or UUIDS in params',
        data: null
      },
      400
    )
  }
  try {
    if (idsQuery) idsQuery = JSON.parse(idsQuery) as string[]
  } catch {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Failed to parse query',
        data: null
      },
      400
    )
  }

  if (idQuery) {
    const icon = await db1
      .select({
        id: berryDashMarketplaceIcons.id,
        userId: berryDashMarketplaceIcons.userId,
        data: berryDashMarketplaceIcons.data,
        hash: berryDashMarketplaceIcons.hash,
        timestamp: berryDashMarketplaceIcons.timestamp,
        price: berryDashMarketplaceIcons.price,
        name: berryDashMarketplaceIcons.name
      })
      .from(berryDashMarketplaceIcons)
      .where(eq(berryDashMarketplaceIcons.id, idQuery))
      .limit(1)
      .execute()
    if (!icon[0]) {
      connection0.end()
      connection1.end()
      return jsonResponse(
        {
          success: false,
          message: 'Icon does not exist',
          data: null
        },
        400
      )
    }

    if (context.query.raw) {
      const buffer = Buffer.from(icon[0].data, 'base64')
      return new Response(buffer, {
        headers: { 'Content-Type': 'image/png' }
      })
    }

    const userData = await db0
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, icon[0].userId))
      .limit(1)
      .execute()
    if (!userData[0]) {
      connection0.end()
      connection1.end()
      return jsonResponse(
        {
          success: false,
          message: 'Icon does not exist',
          data: null
        },
        400
      )
    }

    const result = {
      username: userData[0].username,
      userId: icon[0].userId,
      data:
        dataQuery && dataQuery.toLowerCase() == 'false' ? null : icon[0].data,
      hash:
        dataQuery && dataQuery.toLowerCase() == 'false' ? null : icon[0].hash,
      id: icon[0].id,
      price: icon[0].price,
      name: atob(icon[0].name)
    }

    connection0.end()
    connection1.end()

    return jsonResponse({ success: true, message: null, data: result })
  } else {
    const icons = await db1
      .select()
      .from(berryDashMarketplaceIcons)
      .where(inArray(berryDashMarketplaceIcons.id, idsQuery as string[]))
      .execute()

    const userIds = Array.from(new Set(icons.map(i => i.userId)))
    const usersData = await db0
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(inArray(users.id, userIds))
      .execute()

    const usersMap = Object.fromEntries(usersData.map(u => [u.id, u.username]))

    const result = icons.map(i => ({
      username: usersMap[i.userId] ?? 'Unknown',
      userId: i.userId,
      data: dataQuery && dataQuery.toLowerCase() == 'false' ? null : i.data,
      hash: dataQuery && dataQuery.toLowerCase() == 'false' ? null : i.hash,
      id: i.id,
      price: i.price,
      name: atob(i.name)
    }))

    connection0.end()
    connection1.end()

    return jsonResponse({ success: true, message: null, data: result })
  }
}
