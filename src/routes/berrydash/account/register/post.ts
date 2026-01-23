import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse
} from '../../../../lib/util'
import isEmail from 'validator/lib/isEmail'
import { berryDashUserData, users, verifyCodes } from '../../../../lib/tables'
import { and, desc, eq, or, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

type Body = {
  username: string
  password: string
  email: string
  verifyCode: string
}

export async function handler (context: Context) {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database', data: null },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo0
  const { connection: connection1, db: db1 } = dbInfo1

  const body = context.body as Body
  if (!body.username || !body.password || !body.email || !body.verifyCode) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message:
          'Username, password, email and verifyCode must be in POST data',
        data: null
      },
      400
    )
  }
  if (body.verifyCode.length != 16) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Invalid verify code (codes can only be used once)',
        data: null
      },
      400
    )
  }
  const ip = getClientIp(context)
  if (!ip) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Failed to get required info',
        data: null
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
        message: 'Invalid verify code (codes can only be used once)',
        data: null
      },
      400
    )

  if (!/^[a-zA-Z0-9]{3,16}$/.test(body.username)) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Username must be 3-16 characters, letters and numbers only',
        data: null
      },
      400
    )
  }

  if (!isEmail(body.email)) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Email is invalid',
        data: null
      },
      400
    )
  }

  if (
    !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_\-+=]{8,}$/.test(body.password)
  ) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message:
          'Password must be at least 8 characters with at least one letter and one number',
        data: null
      },
      400
    )
  }

  const hashedPassword = await bcrypt.hash(body.password, 10)
  const token = randomBytes(256).toString('hex')

  const result = await db0
    .insert(users)
    .values({
      username: body.username,
      password: hashedPassword,
      email: body.email,
      registerTime: time,
      latestIp: ip
    })
    .execute()

  await db1
    .insert(berryDashUserData)
    .values({
      id: result[0].insertId,
      token
    })
    .execute()

  return jsonResponse(
    {
      success: true,
      message: null,
      data: null
    },
    200
  )
}
