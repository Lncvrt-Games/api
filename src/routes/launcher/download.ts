import { Context } from 'elysia'
import { launcherVersionManifest } from '../../lib/tables'
import { getDatabaseConnection } from '../../lib/util'
import { eq, sql } from 'drizzle-orm'

export const handler = async (context: Context) => {
  const dbResult = getDatabaseConnection(0)
  if (!dbResult) return null
  const { connection, db } = dbResult

  await db
    .update(launcherVersionManifest)
    .set({
      downloads: sql`${launcherVersionManifest.downloads} + 1`
    })
    .where(eq(launcherVersionManifest.id, context.query.id))

  connection.end()

  return null
}
