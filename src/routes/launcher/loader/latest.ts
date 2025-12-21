import { loaderUpdates } from '../../../lib/tables'
import { desc, eq } from 'drizzle-orm'
import { getDatabaseConnection, jsonResponse } from '../../../lib/util'

export async function handler () {
  const dbResult = getDatabaseConnection(0)
  if (!dbResult)
    return jsonResponse({ error: 'Failed to connect to database' }, 500)
  const { connection, db } = dbResult

  const version = await db
    .select({
      id: loaderUpdates.id
    })
    .from(loaderUpdates)
    .where(eq(loaderUpdates.hidden, false))
    .orderBy(desc(loaderUpdates.place))
    .limit(1)

  connection.end()

  return version[0].id
}
