import { MySql2Database } from "drizzle-orm/mysql2";
import { launcherUpdates } from "../../../lib/tables";
import { desc, eq } from "drizzle-orm";
import { jsonResponse } from "../../../lib/util";
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
            if (arch == "x86_64") platString = "macos-intel"
            else if (arch == "aarch64") platString = "macos-silicon"
            else {
                return jsonResponse({ error: "Unsupported architecture for macOS" }, 400)
            }
        } else {
            return jsonResponse({ error: "Unsupported platform" }, 400)
        }
    }

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
        sha512sums: JSON.parse(v.sha512sums),
        downloadUrl: undefined as string | undefined,
        sha512sum: undefined as string | undefined
    }))
        .filter(v => {
            if (showAll || !platString) {
                delete v.downloadUrl
                delete v.sha512sum
                return true
            }
            const i = v.platforms.indexOf(platString)
            if (i !== -1) {
                v.downloadUrl = v.downloadUrls[i]
                v.sha512sum = v.sha512sums[i]
                delete v.downloadUrls
                delete v.platforms
                delete v.sha512sums
                return true
            }
            return false
        })

    return jsonResponse(versions[0])
}
