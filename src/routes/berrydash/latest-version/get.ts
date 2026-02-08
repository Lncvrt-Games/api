import { launcherVersionManifest } from '../../../lib/tables'
import { and, desc, eq } from 'drizzle-orm'
import { getDatabaseConnection, jsonResponse } from '../../../lib/util'

export const handler = async () => {
  const dbResult = getDatabaseConnection(0)
  if (!dbResult)
    return jsonResponse({ error: 'Failed to connect to database' }, 500)
  const { connection, db } = dbResult

  const version = await db
    .select({
      displayName: launcherVersionManifest.displayName
    })
    .from(launcherVersionManifest)
    .where(
      and(
        eq(launcherVersionManifest.hidden, false),
        eq(launcherVersionManifest.game, 1)
      )
    )
    .orderBy(desc(launcherVersionManifest.place))
    .limit(1)
    .execute()

  connection.end()

  return version[0] ? version[0].displayName.replace('Berry Dash v', '') : '-1'
}
