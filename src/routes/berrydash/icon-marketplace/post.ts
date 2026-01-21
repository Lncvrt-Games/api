import { Context } from 'elysia'
import { getDatabaseConnection, jsonResponse } from '../../../lib/util'
import {
  berryDashMarketplaceIcons,
  berryDashUserData,
  users
} from '../../../lib/tables'
import { and, eq, inArray, or, sql, not, like } from 'drizzle-orm'

type Body = {
  sortBy: number
  priceRangeEnabled: boolean
  priceRangeMin: number
  priceRangeMax: number
  searchForEnabled: boolean
  searchForValue: string
  onlyShowEnabled: boolean
  onlyShowValue: number
  currentIcons: string[]
}

const requiredKeys = [
  'sortBy',
  'priceRangeEnabled',
  'priceRangeMin',
  'priceRangeMax',
  'searchForEnabled',
  'searchForValue',
  'onlyShowEnabled',
  'onlyShowValue',
  'currentIcons'
]

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

  const body: { [key: string]: any } = context.body as any

  for (const key of requiredKeys) {
    if (!(key in body)) {
      return jsonResponse(
        { success: false, message: 'Invalid POST data', data: null },
        400
      )
    }
  }

  let body2: { [key: string]: any } = {}
  body2.sortBy = Number(body.sortBy)
  body2.priceRangeEnabled = body.priceRangeEnabled.toLowerCase() === 'true'
  body2.priceRangeMin = Number(body.priceRangeMin)
  body2.priceRangeMax = Number(body.priceRangeMax)
  body2.searchForEnabled = body.searchForEnabled.toLowerCase() === 'true'
  body2.searchForValue = body.searchForValue as string
  body2.onlyShowEnabled = body.onlyShowEnabled.toLowerCase() === 'true'
  body2.onlyShowValue = Number(body.onlyShowValue)
  body2.currentIcons = JSON.parse(atob(body.currentIcons))
  const body3: Body = body2 as Body

  const authorizationToken = context.headers.authorization
  if (!authorizationToken) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'Unauthorized', data: null },
      401
    )
  }

  const userData = await db1
    .select({ id: berryDashUserData.id })
    .from(berryDashUserData)
    .where(eq(berryDashUserData.token, authorizationToken))
    .execute()

  if (!userData[0]) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      { success: false, message: 'Unauthorized', data: null },
      401
    )
  }

  const userId = userData[0].id

  const filters: any[] = [
    or(
      eq(berryDashMarketplaceIcons.state, 1),
      eq(berryDashMarketplaceIcons.state, 2)
    )
  ]

  if (body3.priceRangeEnabled) {
    filters.push(
      sql`${berryDashMarketplaceIcons.price} >= ${body3.priceRangeMin}`,
      sql`${berryDashMarketplaceIcons.price} <= ${body3.priceRangeMax}`
    )
  }

  if (body3.searchForEnabled) {
    filters.push(
      sql`FROM_BASE64(${
        berryDashMarketplaceIcons.name
      }) LIKE ${`%${body3.searchForValue}%`}`
    )
  }

  if (body3.onlyShowEnabled) {
    if (body3.onlyShowValue === 0) {
      filters.push(eq(berryDashMarketplaceIcons.userId, userId))
    } else if (body3.onlyShowValue === 1) {
      filters.push(sql`${berryDashMarketplaceIcons.userId} != ${userId}`)
    } else if (body3.onlyShowValue === 2) {
      filters.push(inArray(berryDashMarketplaceIcons.uuid, body3.currentIcons))
    } else if (body3.onlyShowValue === 3) {
      filters.push(
        not(inArray(berryDashMarketplaceIcons.uuid, body3.currentIcons))
      )
    }
  }

  let orderBy: any
  switch (body3.sortBy) {
    case 1:
      orderBy = sql`price ASC`
      break
    case 2:
      orderBy = sql`id ASC`
      break
    case 3:
      orderBy = sql`id DESC`
      break
    default:
      orderBy = sql`price DESC`
      break
  }

  const icons = await db1
    .select()
    .from(berryDashMarketplaceIcons)
    .where(and(...filters))
    .orderBy(orderBy)
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
    userid: i.userId,
    data: i.data,
    uuid: i.uuid,
    price: i.state === 2 ? 100000000 : i.price,
    name: atob(i.name)
  }))

  connection0.end()
  connection1.end()

  return jsonResponse({ success: true, message: null, data: result })
}
