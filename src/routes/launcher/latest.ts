import { launcherUpdates } from '../../lib/tables'
import { desc, eq } from 'drizzle-orm'
import { getDatabaseConnection, jsonResponse } from '../../lib/util'

export async function handler () {
  const dbResult = getDatabaseConnection(0)
  if (!dbResult)
    return jsonResponse({ error: 'Failed to connect to database' }, 500)
  const { connection, db } = dbResult

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
