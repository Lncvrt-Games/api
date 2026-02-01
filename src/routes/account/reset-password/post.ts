import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse,
  verifyTurstileOrVerifyCode
} from '../../../lib/util'
import { resetCodes, users } from '../../../lib/tables'
import { and, desc, eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

type Body = {
  token: string | null
  verifyCode: string | null
  code: string
  password: string
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
  if (!body.token || !body.code || !body.password) {
    connection0.end()
    return jsonResponse(
      {
        success: false,
        message: 'Token, code and password must be in POST data'
      },
      400
    )
  }
  if (body.code.length != 64) {
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

  if (!(await verifyTurstileOrVerifyCode(body.token, body.verifyCode, ip, db0)))
    return jsonResponse(
      {
        success: false,
        message:
          body.token != null
            ? 'Invalid captcha token'
            : 'Invalid verify code (codes can only be used once)'
      },
      400
    )

  const time = Math.floor(Date.now() / 1000)
  const codeExists = await db0
    .select({ id: resetCodes.id, userId: resetCodes.userId })
    .from(resetCodes)
    .where(
      and(
        eq(resetCodes.ip, ip),
        eq(resetCodes.usedTimestamp, 0),
        eq(resetCodes.code, body.code),
        sql`${resetCodes.timestamp} >= UNIX_TIMESTAMP() - 600`,
        eq(resetCodes.type, 0)
      )
    )
    .orderBy(desc(resetCodes.id))
    .limit(1)
    .execute()
  if (codeExists[0]) {
    await db0
      .update(resetCodes)
      .set({ usedTimestamp: time })
      .where(
        and(
          eq(resetCodes.id, codeExists[0].id),
          eq(resetCodes.ip, ip),
          eq(resetCodes.usedTimestamp, 0),
          eq(resetCodes.code, body.code),
          eq(resetCodes.type, 0)
        )
      )
      .execute()
    const hashedPassword = await bcrypt.hash(body.password, 10)
    await db0
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, codeExists[0].userId))
      .execute()
    connection0.end()
    return jsonResponse(
      {
        success: true,
        message: null
      },
      200
    )
  } else {
    connection0.end()
    return jsonResponse(
      {
        success: false,
        message: 'Invalid reset code (codes can only be used once)'
      },
      400
    )
  }
}
