import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse,
  sendEmail
} from '../../../lib/util'
import { resetCodes, users, verifyCodes } from '../../../lib/tables'
import { and, desc, eq, sql } from 'drizzle-orm'
import isEmail from 'validator/lib/isEmail'
import { randomBytes } from 'crypto'

type Body = {
  email: string
  verifyCode: string
}

export async function handler (context: Context) {
  const dbInfo0 = getDatabaseConnection(0)

  if (!dbInfo0)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database' },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo0

  const body = context.body as Body
  if (!body.email || !body.verifyCode) {
    connection0.end()
    return jsonResponse(
      {
        success: false,
        message: 'Email and verifyCode must be in POST data'
      },
      400
    )
  }
  if (body.verifyCode.length != 16) {
    connection0.end()
    return jsonResponse(
      {
        success: false,
        message: 'Invalid verify code (codes can only be used once)'
      },
      400
    )
  }
  const ip = getClientIp(context)
  if (!ip) {
    connection0.end()
    return jsonResponse(
      {
        success: false,
        message: 'Failed to get required info'
      },
      400
    )
  }
  const time = Math.floor(Date.now() / 1000)
  const codeExists = await db0
    .select({ id: verifyCodes.id })
    .from(verifyCodes)
    .where(
      and(
        eq(verifyCodes.ip, ip),
        eq(verifyCodes.usedTimestamp, 0),
        eq(verifyCodes.code, body.verifyCode),
        sql`${verifyCodes.timestamp} >= UNIX_TIMESTAMP() - 600`
      )
    )
    .orderBy(desc(verifyCodes.id))
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
          eq(verifyCodes.code, body.verifyCode)
        )
      )
  } else
    return jsonResponse(
      {
        success: false,
        message: 'Invalid verify code (codes can only be used once)'
      },
      400
    )

  const notFound = `You requested information about your account. Unfortunately, we were unable to find your account associated with this email. This is caused by either an incorrect email provided during signup, or this email not owning a Lncvrt Games account.`

  if (!isEmail(body.email)) {
    connection0.end()
    sendEmail(body.email, 'User information reset - Password', notFound)
  }

  const result = await db0
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.email, body.email))
    .execute()

  if (!result[0]) {
    connection0.end()
    sendEmail(body.email, 'User information reset - Password', notFound)
  }

  let code = randomBytes(32).toString('hex')
  const resetCodeExists = await db0
    .select({ code: resetCodes.code })
    .from(resetCodes)
    .where(
      and(
        eq(resetCodes.ip, ip),
        eq(resetCodes.usedTimestamp, 0),
        sql`${resetCodes.timestamp} >= UNIX_TIMESTAMP() - 600`
      )
    )
    .orderBy(desc(resetCodes.id))
    .limit(1)
    .execute()
  if (resetCodeExists[0]) {
    code = resetCodeExists[0].code
  } else {
    await db0.insert(resetCodes).values({ code, ip, timestamp: time })
  }

  sendEmail(
    body.email,
    'User information request - Password',
    `You have requested a password reset for your Lncvrt Games account.\n\nYour account information:\nUsername: ${result[0].username}\n\nPlease click on the link below to reset your password:\nhttps://games.lncvrt.xyz/account/reset-password?code=${code}\n\nNote: This password reset link expires in 10 minutes or until used.`
  )

  connection0.end()

  return jsonResponse(
    {
      success: true,
      message: null
    },
    400
  )
}
