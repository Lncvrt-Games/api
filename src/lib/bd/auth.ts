import { MySql2Database } from 'drizzle-orm/mysql2'
import { berryDashUserData } from '../tables'
import { eq } from 'drizzle-orm'

export async function checkAuthorization (
  authorizationToken: string,
  db1: MySql2Database
) {
  if (!authorizationToken) return { valid: false, id: 0 }

  const userData = await db1
    .select({ id: berryDashUserData.id })
    .from(berryDashUserData)
    .where(eq(berryDashUserData.token, authorizationToken))
    .execute()

  if (!userData[0]) return { valid: false, id: 0 }
  else return { valid: true, id: userData[0].id }
}
