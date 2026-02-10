import { games, launcherVersionManifest } from '../../lib/tables'
import { asc, desc, eq } from 'drizzle-orm'
import { getDatabaseConnection, jsonResponse } from '../../lib/util'
import { Context } from 'elysia'

export const handler = async (context: Context) => {
  const dbResult = getDatabaseConnection(0)
  if (!dbResult)
    return jsonResponse({ error: 'Failed to connect to database' }, 500)
  const { connection, db } = dbResult

  const platform = context.query.platform as string | undefined
  const arch = context.query.arch as string | undefined
  let showAll = false

  if (!platform || !arch) {
    showAll = true
  }

  let platString = null
  if (!showAll) {
    if (platform == 'windows') {
      if (arch == 'x86_64' || arch == 'x64') platString = 'windows'
      else if (arch == 'aarch64' || arch == 'arm64')
        platString = 'windows-arm64'
      else {
        connection.end()
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
      if (arch == 'x86_64' || arch == 'x64') platString = 'linux'
      else {
        connection.end()
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
      if (arch == 'x86_64' || arch == 'x64') platString = 'macos'
      else if (arch == 'aarch64' || arch == 'arm64') platString = 'macos'
      else {
        connection.end()
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
      connection.end()
      return jsonResponse(
        { message: 'Unsupported platform', versions: null, games: null },
        400
      )
    }
  }

  const versionsRaw = await db
    .select({
      id: launcherVersionManifest.id,
      displayName: launcherVersionManifest.displayName,
      releaseDate: launcherVersionManifest.releaseDate,
      game: launcherVersionManifest.game,
      downloadUrls: launcherVersionManifest.downloadUrls,
      platforms: launcherVersionManifest.platforms,
      executables: launcherVersionManifest.executables,
      sha512sums: launcherVersionManifest.sha512sums,
      sizes: launcherVersionManifest.sizes,
      place: launcherVersionManifest.place,
      changelog: launcherVersionManifest.changelog,
      category: launcherVersionManifest.category,
      lastRevision: launcherVersionManifest.lastRevision
    })
    .from(launcherVersionManifest)
    .where(eq(launcherVersionManifest.hidden, false))
    .orderBy(
      asc(launcherVersionManifest.game),
      desc(launcherVersionManifest.place)
    )
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
      size: undefined as number | undefined,
      wine: undefined as boolean | undefined
    }))
    .filter(v => {
      if (showAll || !platString) {
        delete v.downloadUrl
        delete v.executable
        delete v.sha512sum
        delete v.size
        delete v.wine
        return true
      }
      let i = v.platforms.indexOf(platString)
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
        delete v.wine
        return true
      } else if (platString == 'linux') {
        i = v.platforms.indexOf('windows')
        if (i !== -1) {
          v.downloadUrl = v.downloadUrls[i]
          v.executable = v.executables[i]
          v.sha512sum = v.sha512sums[i]
          v.size = v.sizes[i]
          v.wine = true
          delete v.downloadUrls
          delete v.platforms
          delete v.executables
          delete v.sha512sums
          delete v.sizes
          return true
        }
      }
      return false
    })

  const gamesListRaw = await db.select().from(games).execute()

  const gamesList = gamesListRaw.map(v => ({
    ...v,
    categoryNames: JSON.parse(v.categoryNames)
  }))

  connection.end()

  return jsonResponse({ versions, games: gamesList })
}
