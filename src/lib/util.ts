import mysql from 'mysql2'
import { drizzle } from 'drizzle-orm/mysql2'
import {
  allowedDatabaseVersions,
  allowedVersions,
  latestBetaVersion,
  latestVersion
} from '../info/general'

export function jsonResponse (data: any, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function getDatabaseConnection (type: number) {
  if (type !== 0 && type !== 1) return null

  const env =
    type === 0
      ? {
          host: process.env.GAMES_DB_HOST ?? 'localhost',
          port: Number(process.env.GAMES_DB_PORT) || 3306,
          user: process.env.GAMES_DB_USER ?? '',
          pass: process.env.GAMES_DB_PASS ?? '',
          name: process.env.GAMES_DB_NAME ?? ''
        }
      : {
          host: process.env.BERRYDASH_DB_HOST ?? 'localhost',
          port: Number(process.env.BERRYDASH_DB_PORT) || 3306,
          user: process.env.BERRYDASH_DB_USER ?? '',
          pass: process.env.BERRYDASH_DB_PASS ?? '',
          name: process.env.BERRYDASH_DB_NAME ?? ''
        }

  const connection = mysql.createConnection({
    host: env.host,
    port: env.port,
    user: env.user,
    password: env.pass,
    database: env.name
  })
  const db = drizzle(connection)

  return { connection, db }
}

export const isLatestVersion = (version: string) => version === latestVersion

export const isBetaVersion = (version: string) => version === latestBetaVersion

export const isAllowedVersion = (version: string) =>
  allowedVersions.includes(version)

export const isAllowedDatabaseVersion = (version: string) =>
  allowedDatabaseVersions.includes(version)

export const checkClientDatabaseVersion = (request: Request) => {
  const requester = request.headers.get('http_requester') ?? ''
  const clientVersion = request.headers.get('http_clientversion') ?? ''
  if (requester !== 'BerryDashClient') return '-998'
  if (!allowedDatabaseVersions.includes(clientVersion)) return '-998'
}

export const genTimestamp = (time: number): string => {
  time = Math.floor(Date.now() / 1000) - time
  time = time < 1 ? 1 : time

  const tokens: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
    [1, 'second']
  ]

  for (const [unit, text] of tokens) {
    if (time < unit) continue

    const numberOfUnits = Math.floor(time / unit)
    return numberOfUnits + ' ' + text + (numberOfUnits > 1 ? 's' : '')
  }

  return '1 second'
}
