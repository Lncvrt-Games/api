import { launcherUpdates } from '../../lib/tables'
import { desc, eq } from 'drizzle-orm'
import { getDatabaseConnection } from '../../lib/util'

export async function handler () {
  const { connection, db } = getDatabaseConnection()

  const version = await db
    .select({
      id: launcherUpdates.id
    })
    .from(launcherUpdates)
    .where(eq(launcherUpdates.hidden, false))
    .orderBy(desc(launcherUpdates.place))
    .limit(1)

  connection.end()

  return version[0].id
}
