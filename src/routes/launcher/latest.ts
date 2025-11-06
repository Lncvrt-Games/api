import { MySql2Database } from "drizzle-orm/mysql2"
import { launcherUpdates } from "../../lib/tables"
import { desc, eq } from "drizzle-orm"

export async function handler(db: MySql2Database) {
    const version = await db.select({
        id: launcherUpdates.id
    })
        .from(launcherUpdates)
        .where(eq(launcherUpdates.hidden, false))
        .orderBy(desc(launcherUpdates.place))
        .limit(1)

    return version[0].id
}