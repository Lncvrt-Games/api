import { MySql2Database } from 'drizzle-orm/mysql2'
import { users } from './tables'
import { eq } from 'drizzle-orm'

export async function checkAuthorization (
  authorizationToken: string,
  db0: MySql2Database,
  updateIp: string | null
) {
  if (!authorizationToken) return { valid: false, id: 0 }

  const userData = await db0
    .select({ id: users.id })
    .from(users)
    .where(eq(users.token, authorizationToken))
    .execute()

  if (!userData[0]) return { valid: false, id: 0 }
  else {
    if (updateIp != null)
      db0
        .update(users)
        .set({ latestIp: updateIp })
        .where(eq(users.id, userData[0].id))
        .execute()

    return { valid: true, id: userData[0].id }
  }
}
