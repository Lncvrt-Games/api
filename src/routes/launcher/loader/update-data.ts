import { MySql2Database } from "drizzle-orm/mysql2";
import { launcherUpdates } from "../../../lib/tables";
import { desc, eq } from "drizzle-orm";
import { jsonResponse } from "../../../lib/util";

export async function handler(db: MySql2Database) {
    const versionsRaw = await db.select({
        id: launcherUpdates.id,
        releaseDate: launcherUpdates.releaseDate,
        downloadUrls: launcherUpdates.downloadUrls,
        platforms: launcherUpdates.platforms,
        sha512sums: launcherUpdates.sha512sums
    })
        .from(launcherUpdates)
        .where(eq(launcherUpdates.hidden, false))
        .orderBy(desc(launcherUpdates.place))
        .limit(1)
        .execute()

    const versions = versionsRaw.map(v => ({
        ...v,
        downloadUrls: JSON.parse(v.downloadUrls),
        platforms: JSON.parse(v.platforms),
        sha512sums: JSON.parse(v.sha512sums)
    }))

    return jsonResponse(versions[0])
}
