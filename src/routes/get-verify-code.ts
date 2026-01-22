import axios from 'axios'
import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse,
  validateTurnstile
} from '../lib/util'
import { randomBytes } from 'crypto'
import { verifyCodes } from '../lib/tables'

type Body = {
  token: string
}

export async function handler (context: Context) {
  const body = context.body as Body
  const ip = getClientIp(context)
  const code = randomBytes(8).toString('hex')
  const time = Math.floor(Date.now() / 1000)

  if (!ip || !body.token)
    return jsonResponse(
      {
        success: false,
        message: 'Unable to verify captcha key',
        data: null
      },
      400
    )

  const result = await validateTurnstile(body.token, ip)
  if (!result.success)
    return jsonResponse(
      {
        success: false,
        message: 'Unable to verify captcha key',
        data: null
      },
      400
    )

  const dbInfo0 = getDatabaseConnection(0)

  if (!dbInfo0)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database', data: null },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo0

  await db0.insert(verifyCodes).values({ code, ip, timestamp: time })

  return jsonResponse(
    {
      success: true,
      message: null,
      data: code
    },
    200
  )
}
