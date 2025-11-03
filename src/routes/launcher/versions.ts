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

    let platString = null
    if (!showAll) {
        if (platform == "windows") {
            if (arch == "x86_64") platString = "windows"
            else if (arch == "aarch64") platString = "windows-arm64"
            else {
                return jsonResponse({ error: "Unsupported architecture for Windows" }, 400)
            }
        } else if (platform == "linux") {
            if (arch == "x86_64") platString = "linux"
            else {
                return jsonResponse({ error: "Unsupported architecture for Linux" }, 400)
            }
        } else if (platform == "macos") {
            if (arch == "x86_64" || arch == "aarch64") platString = "macos"
            else {
                return jsonResponse({ error: "Unsupported architecture for macOS" }, 400)
            }
        }
    }

    const versionsRaw = await db.select({
        id: launcherVersions.id,
        versionName: launcherVersions.versionName,
        releaseDate: launcherVersions.releaseDate,
        game: launcherVersions.game,
        downloadUrls: launcherVersions.downloadUrls,
        platforms: launcherVersions.platforms,
        executables: launcherVersions.executables,
        sha512sums: launcherVersions.sha512sums
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
        sha512sums: JSON.parse(v.sha512sums),
        downloadUrl: undefined as string | undefined,
        executable: undefined as string | undefined,
        sha512sum: undefined as string | undefined
    }))
        .filter(v => {
            if (showAll || !platString) {
                delete v.downloadUrl
                delete v.executable
                delete v.sha512sum
                return true
            }
            const i = v.platforms.indexOf(platString)
            if (i !== -1) {
                v.downloadUrl = v.downloadUrls[i]
                v.executable = v.executables[i]
                v.sha512sum = v.sha512sums[i]
                delete v.downloadUrls
                delete v.platforms
                delete v.executables
                delete v.sha512sums
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