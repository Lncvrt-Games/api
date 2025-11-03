import { MySql2Database } from "drizzle-orm/mysql2";
import { launcherGames, launcherVersions } from "../../lib/tables";
import { asc, desc, eq } from "drizzle-orm";
import { jsonResponse } from "../../lib/util";
import { Context } from "elysia";

export async function handler(context: Context, db: MySql2Database) {
    const platform = context.query.platform as string | undefined
    const arch = context.query.arch as string | undefined
    let showAll = false

    if (!platform || !arch) {
        showAll = true
    }

    let platString = platform
    if (!showAll) {
        if (platform == "windows") {
            if (arch == "x86_64") platString = "windows"
            else if (arch == "aarch64") platString = "windows-arm64"
        }
    }

    const versionsRaw = await db.select({
        id: launcherVersions.id,
        versionName: launcherVersions.versionName,
        releaseDate: launcherVersions.releaseDate,
        downloadUrls: launcherVersions.downloadUrls,
        platforms: launcherVersions.platforms,
        executables: launcherVersions.executables,
        game: launcherVersions.game
    }).from(launcherVersions)
        .where(eq(launcherVersions.hidden, false))
        .orderBy(
            asc(launcherVersions.game),
            desc(launcherVersions.place)
        )
        .execute()

    const versions = versionsRaw.map(v => ({
        ...v,
        downloadUrls: JSON.parse(v.downloadUrls),
        platforms: JSON.parse(v.platforms),
        executables: JSON.parse(v.executables),
        downloadUrl: null as string | null,
        executable: null as string | null
    }))
        .filter(v => {
            if (showAll) return true
            const i = v.platforms.indexOf(platString)
            if (i !== -1) {
                v.downloadUrl = v.downloadUrls[i]
                v.executable = v.executables[i]
                delete v.downloadUrls
                delete v.platforms
                delete v.executables
                return true
            }
            return false
        })

    const gamesRaw = await db.select().from(launcherGames).execute()

    const games = gamesRaw.map(v => ({
        ...v,
        cutOff: v.cutOff === -1 ? null : v.cutOff
    }))

    return jsonResponse({ versions, games })
}