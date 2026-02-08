import mysql from 'mysql2'
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2'
import {
  allowedDatabaseVersions,
  allowedVersions,
  latestBetaVersion,
  latestVersion
} from '../info/general'
import { Context } from 'elysia'
import axios from 'axios'
import FormData from 'form-data'
import nodemailer from 'nodemailer'
import { createHash } from 'crypto'
import { and, eq, sql } from 'drizzle-orm'
import { verifyCodes } from './tables'

export const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export const getDatabaseConnection = (type: number) => {
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

  return response.data.success
}

export const validateVerifyCode = async (
  db0: MySql2Database,
  ip: string,
  verifyCode: string
): Promise<boolean> => {
  const time = Math.floor(Date.now() / 1000)
  const codeExists = await db0
    .select({ id: verifyCodes.id })
    .from(verifyCodes)
    .where(
      and(
        eq(verifyCodes.ip, ip),
        eq(verifyCodes.usedTimestamp, 0),
        eq(verifyCodes.code, verifyCode),
        sql`${verifyCodes.timestamp} >= UNIX_TIMESTAMP() - 600`
      )
    )
    .limit(1)
    .execute()
  if (codeExists[0]) {
    await db0
      .update(verifyCodes)
      .set({ usedTimestamp: time })
      .where(
        and(
          eq(verifyCodes.id, codeExists[0].id),
          eq(verifyCodes.ip, ip),
          eq(verifyCodes.usedTimestamp, 0),
          eq(verifyCodes.code, verifyCode)
        )
      )
      .execute()
    return true
  } else return false
}

export const verifyTurstileOrVerifyCode = (
  token: string | null,
  verifyCode: string | null,
  ip: string,
  db0: MySql2Database
) => {
  if (token != null) {
    return validateTurnstile(token, ip)
  } else if (verifyCode != null) {
    return validateVerifyCode(db0, ip, verifyCode)
  }
  return false
}

export const sendEmail = async (to: string, title: string, body: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USERNAME ?? '',
      pass: process.env.GMAIL_APP_PASSWORD ?? ''
    }
  })

  const mailOptions = {
    from: `"Lncvrt Games" <${process.env.GMAIL_USERNAME ?? ''}>`,
    to: to,
    subject: title,
    text:
      body +
      `\n\nPlease contact ${process.env.GMAIL_USERNAME} if you have any questions or need assistance.`
  }

  return await transporter.sendMail(mailOptions)
}

export const hash = (input: string, type: string): string => {
  return createHash(type).update(input).digest('hex')
}
