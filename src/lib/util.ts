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

export function getDatabaseConnection () {
  const connection = mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER ?? '',
    password: process.env.DB_PASS ?? '',
    database: process.env.DB_NAME ?? ''
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
