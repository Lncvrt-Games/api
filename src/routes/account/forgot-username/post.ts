import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse,
  sendEmail,
  verifyTurstileOrVerifyCode
} from '../../../lib/util'
import isEmail from 'validator/lib/isEmail'
import { users } from '../../../lib/tables'
import { eq } from 'drizzle-orm'

type Body = {
  token: string | null
  verifyCode: string | null
  email: string
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
  if (
    !(await verifyTurstileOrVerifyCode(body.token, body.verifyCode, ip, db0))
  ) {
    connection0.end()
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
  }

  const notFound = `You requested information about your account, your username\n\nUnfortunately, we were unable to find your username associated with this email. This is caused by either an incorrect email provided during signup, or this email not owning a Lncvrt Games account.`

  if (!isEmail(body.email)) {
    connection0.end()
    sendEmail(body.email, 'User information request - Username', notFound)
  }

  const result = await db0
    .select({ username: users.username })
    .from(users)
    .where(eq(users.email, body.email))
    .execute()

  if (!result[0]) {
    connection0.end()
    sendEmail(body.email, 'User information request - Username', notFound)
  }

  sendEmail(
    body.email,
    'User information request - Username',
    `You have requested information about your Lncvrt Games account.\n\nYour account information:\nUsername: ${result[0].username}`
  )

  connection0.end()

  return jsonResponse(
    {
      success: true,
      message: null
    },
    200
  )
}
