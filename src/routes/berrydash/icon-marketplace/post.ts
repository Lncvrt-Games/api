import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse
} from '../../../lib/util'
import { berryDashMarketplaceIcons, users } from '../../../lib/tables'
import { and, eq, inArray, or, sql, not, desc, asc } from 'drizzle-orm'
import { checkAuthorization } from '../../../lib/auth'

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

  const ip = getClientIp(context)
  const authorizationToken = context.headers.authorization
  const authResult = await checkAuthorization(
    authorizationToken as string,
    db0,
    ip
  )
  let userId: number | null = null
  if (authResult.valid) {
    userId = authResult.id
  }

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

  const filters: any[] = [eq(berryDashMarketplaceIcons.state, 1)]

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
    if (body3.onlyShowValue === 0 && userId) {
      filters.push(eq(berryDashMarketplaceIcons.userId, userId))
    } else if (body3.onlyShowValue === 1 && userId) {
      filters.push(sql`${berryDashMarketplaceIcons.userId} != ${userId}`)
    } else if (body3.onlyShowValue === 2) {
      filters.push(inArray(berryDashMarketplaceIcons.id, body3.currentIcons))
    } else if (body3.onlyShowValue === 3) {
      filters.push(
        not(inArray(berryDashMarketplaceIcons.id, body3.currentIcons))
      )
    }
  }

  let orderBy: any
  switch (body3.sortBy) {
    case 1:
      orderBy = asc(berryDashMarketplaceIcons.price)
      break
    case 2:
      orderBy = asc(berryDashMarketplaceIcons.place)
      break
    case 3:
      orderBy = desc(berryDashMarketplaceIcons.place)
      break
    default:
      orderBy = desc(berryDashMarketplaceIcons.price)
      break
  }

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
