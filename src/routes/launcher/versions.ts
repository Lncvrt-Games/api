import type { Context } from "elysia";
import { MySql2Database } from "drizzle-orm/mysql2";
import { launcherGames, launcherVersions } from "../../lib/tables";
import { eq } from "drizzle-orm";
import { jsonResponse } from "../../lib/util";

export async function handler(context: Context, db: MySql2Database) {
    const versionsRaw = await db.select({
        id: launcherVersions.id,
        versionName: launcherVersions.versionName,
        releaseDate: launcherVersions.releaseDate,
        downloadUrls: launcherVersions.downloadUrls,
        platforms: launcherVersions.platforms,
        executables: launcherVersions.executables,
        game: launcherVersions.game,
        place: launcherVersions.place
    }).from(launcherVersions).where(eq(launcherVersions.hidden, false)).execute()

    const versions = versionsRaw.map(v => ({
        ...v,
        downloadUrls: JSON.parse(v.downloadUrls),
        platforms: JSON.parse(v.platforms),
        executables: JSON.parse(v.executables)
    }))

    const gamesRaw = await db.select().from(launcherGames).execute()

    const games = gamesRaw.map(v => ({
        ...v,
        cutOff: v.cutOff === -1 ? null : v.cutOff
    }))

    return jsonResponse({ versions, games })
}