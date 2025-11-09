import { launcherGames, launcherVersions } from '../../lib/tables'
import { asc, desc, eq } from 'drizzle-orm'
import { getDatabaseConnection, jsonResponse } from '../../lib/util'
import { Context } from 'elysia'

export async function handler (context: Context) {
  const db = getDatabaseConnection()

  const platform = context.query.platform as string | undefined
  const arch = context.query.arch as string | undefined
  let showAll = false

  if (!platform || !arch) {
    showAll = true
  }

  let platString = null
  if (!showAll) {
    if (platform == 'windows') {
      if (arch == 'x86_64') platString = 'windows'
      else if (arch == 'aarch64') platString = 'windows-arm64'
      else {
        return jsonResponse(
          {
            message: 'Unsupported architecture for Windows',
            versions: null,
            games: null
          },
          400
        )
      }
    } else if (platform == 'linux') {
      if (arch == 'x86_64') platString = 'linux'
      else {
        return jsonResponse(
          {
            message: 'Unsupported architecture for Linux',
            versions: null,
            games: null
          },
          400
        )
      }
    } else if (platform == 'macos') {
      if (arch == 'x86_64' || arch == 'aarch64') platString = 'macos'
      else {
        return jsonResponse(
          {
            message: 'Unsupported architecture for macOS',
            versions: null,
            games: null
          },
          400
        )
      }
    } else if (platform == 'android') platString = 'android'
    else if (platform == 'ios') platString = 'ios'
    else {
      return jsonResponse(
        { message: 'Unsupported platform', versions: null, games: null },
        400
      )
    }
  }

  const versionsRaw = await db
    .select({
      id: launcherVersions.id,
      versionName: launcherVersions.versionName,
      releaseDate: launcherVersions.releaseDate,
      game: launcherVersions.game,
      downloadUrls: launcherVersions.downloadUrls,
      platforms: launcherVersions.platforms,
      executables: launcherVersions.executables,
      sha512sums: launcherVersions.sha512sums,
      sizes: launcherVersions.sizes
    })
    .from(launcherVersions)
    .where(eq(launcherVersions.hidden, false))
    .orderBy(asc(launcherVersions.game), desc(launcherVersions.place))
    .execute()

  const versions = versionsRaw
    .map(v => ({
      ...v,
      downloadUrls: JSON.parse(v.downloadUrls),
      platforms: JSON.parse(v.platforms),
      executables: JSON.parse(v.executables),
      sha512sums: JSON.parse(v.sha512sums),
      sizes: JSON.parse(v.sizes),
      downloadUrl: undefined as string | undefined,
      executable: undefined as string | undefined,
      sha512sum: undefined as string | undefined,
      size: undefined as number | undefined
    }))
    .filter(v => {
      if (showAll || !platString) {
        delete v.downloadUrl
        delete v.executable
        delete v.sha512sum
        delete v.size
        return true
      }
      const i = v.platforms.indexOf(platString)
      if (i !== -1) {
        v.downloadUrl = v.downloadUrls[i]
        v.executable = v.executables[i]
        v.sha512sum = v.sha512sums[i]
        v.size = v.sizes[i]
        delete v.downloadUrls
        delete v.platforms
        delete v.executables
        delete v.sha512sums
        delete v.sizes
        return true
      }
      return false
    })

  const games = await db.select().from(launcherGames).execute()

  return jsonResponse({ versions, games })
}
