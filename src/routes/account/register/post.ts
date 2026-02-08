import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse,
  verifyTurstileOrVerifyCode
} from '../../../lib/util'
import isEmail from 'validator/lib/isEmail'
import { berryDashUserData, users } from '../../../lib/tables'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

type Body = {
  token: string | null
  verifyCode: string | null
  username: string
  password: string
  email: string
}

export const handler = async (context: Context) => {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database' },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo0
  const { connection: connection1, db: db1 } = dbInfo1

  const body = context.body as Body
  const ip = getClientIp(context)
  if (!ip) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Failed to get required info'
      },
      400
    )
  }
  const time = Math.floor(Date.now() / 1000)
  if (
    !(await verifyTurstileOrVerifyCode(body.token, body.verifyCode, ip, db0))
  ) {
    connection0.end()
    connection1.end()
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

  if (!/^[a-zA-Z0-9]{3,16}$/.test(body.username)) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Username must be 3-16 characters, letters and numbers only'
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
        message: 'Email is invalid'
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
          'Password must be at least 8 characters with at least one letter and one number'
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
      token,
      registerTime: time,
      latestIp: ip
    })
    .execute()

  await db1
    .insert(berryDashUserData)
    .values({
      id: result[0].insertId
    })
    .execute()

  connection0.end()
  connection1.end()

  return jsonResponse(
    {
      success: true,
      message: null
    },
    200
  )
}
