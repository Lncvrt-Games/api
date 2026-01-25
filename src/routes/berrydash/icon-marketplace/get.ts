import { Context } from 'elysia'
import { getDatabaseConnection, jsonResponse } from '../../../lib/util'
import { berryDashMarketplaceIcons, users } from '../../../lib/tables'
import { desc, eq, inArray } from 'drizzle-orm'

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

  const icons = await db1
    .select({
      id: berryDashMarketplaceIcons.id,
      userId: berryDashMarketplaceIcons.userId,
      data: berryDashMarketplaceIcons.data,
      hash: berryDashMarketplaceIcons.hash,
      timestamp: berryDashMarketplaceIcons.timestamp,
      state: berryDashMarketplaceIcons.state,
      price: berryDashMarketplaceIcons.price,
      name: berryDashMarketplaceIcons.name
    })
    .from(berryDashMarketplaceIcons)
    .where(eq(berryDashMarketplaceIcons.state, 1))
    .orderBy(desc(berryDashMarketplaceIcons.place))
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
    hash: i.hash,
    id: i.id,
    price: i.price,
    buyable: i.state == 1,
    name: atob(i.name)
  }))

  connection0.end()
  connection1.end()

  return jsonResponse({ success: true, message: null, data: result })
}
