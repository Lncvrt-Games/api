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

  let uuidQuery = context.query.uuid
  let idQuery = context.query.id ? parseInt(context.query.id, 10) : 0
  let uuidsQuery = context.query.uuids
  let idsQuery = context.query.ids
  if (!uuidQuery && !idQuery && !uuidsQuery && !idsQuery) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Must have either ID, UUID, IDS, or UUIDS in params',
        data: null
      },
      400
    )
  }
  try {
    if (uuidsQuery) uuidsQuery = JSON.parse(uuidsQuery)
    if (idsQuery) idsQuery = JSON.parse(idsQuery)
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

  if (idQuery || uuidQuery) {
    const icon = await db1
      .select()
      .from(berryDashMarketplaceIcons)
      .where(
        !uuidQuery
          ? eq(berryDashMarketplaceIcons.id, idQuery)
          : eq(berryDashMarketplaceIcons.uuid, uuidQuery)
      )
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
      data: icon[0].data,
      id: icon[0].id,
      price: icon[0].price,
      buyable: icon[0].state == 1,
      name: atob(icon[0].name)
    }

    connection0.end()
    connection1.end()

    return jsonResponse({ success: true, message: null, data: result })
  } else {
    const icons = await db1
      .select()
      .from(berryDashMarketplaceIcons)
      .where(
        !uuidsQuery
          ? inArray(
              berryDashMarketplaceIcons.id,
              idsQuery as unknown as number[]
            )
          : inArray(
              berryDashMarketplaceIcons.uuid,
              uuidsQuery as unknown as string[]
            )
      )
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
      data: i.data,
      id: i.id,
      price: i.price,
      buyable: i.state == 1,
      name: atob(i.name)
    }))

    connection0.end()
    connection1.end()

    return jsonResponse({ success: true, message: null, data: result })
  }
}
