import mysql from 'mysql2'
import { drizzle } from 'drizzle-orm/mysql2'
import {
  allowedDatabaseVersions,
  allowedVersions,
  latestBetaVersion,
  latestVersion
} from '../info/general'
import { Context } from 'elysia'
import axios from 'axios'
import FormData from 'form-data'

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

export const genTimestamp = (time: number, extra = 0): string => {
  let remaining = Math.floor(Date.now() / 1000) - time
  remaining = remaining < 1 ? 1 : remaining

  const tokens: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
    [1, 'second']
  ]

  const parts: string[] = []

  for (const [unit, text] of tokens) {
    if (remaining < unit) continue
    if (parts.length > extra) break

    const value = Math.floor(remaining / unit)
    remaining -= value * unit

    parts.push(value + ' ' + text + (value > 1 ? 's' : ''))
  }

  return parts.length ? parts.join(' ') : '1 second'
}

export const getClientIp = (context: Context) => {
  const headers = context.headers
  if (!headers) return null

  return (
    headers['cf-connecting-ip'] ??
    headers['x-real-ip'] ??
    headers['x-forwarded-for']?.split(',')[0]?.trim() ??
    null
  )
}

export const validateTurnstile = async (token: string, remoteip: string) => {
  const form = new FormData()
  form.append('secret', process.env.TURNSTILE_SECRET_KEY!)
  form.append('response', token)
  form.append('remoteip', remoteip)

  const response = await axios.post(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    form,
    {
      headers: form.getHeaders()
    }
  )

  return response.data
}
