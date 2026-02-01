import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  jsonResponse,
  verifyTurstileOrVerifyCode
} from '../../../lib/util'
import { checkAuthorization } from '../../../lib/auth'
import { berryDashSplashTexts } from '../../../lib/tables'
import { eq } from 'drizzle-orm'

type Body = {
  token: string | null
  verifyCode: string | null
  content: string
}

export async function handler (context: Context) {
  const dbInfo0 = getDatabaseConnection(0)
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo0 || !dbInfo1)
    return jsonResponse(
      { success: false, message: 'Failed to connect to database' },
      500
    )
  const { connection: connection0, db: db0 } = dbInfo0
  const { connection: connection1, db: db1 } = dbInfo1

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
  const authorizationToken = context.headers.authorization
  const authResult = await checkAuthorization(
    authorizationToken as string,
    db0,
    ip
  )
  if (!authResult.valid) {
    connection0.end()
    connection1.end()
    return jsonResponse({ success: false, message: 'Unauthorized' }, 401)
  }
  const userId = authResult.id

  const body = context.body as Body
  if (body.content.length > 72) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Splash texts cannot be over 72 characters'
      },
      400
    )
  }
  if (
    !/^[ a-zA-Z0-9!@#\$%\^&\*\(\)_\+\-=\[\]\{\};\':",\.<>\/\?\\\\|`~]+$/.test(
      body.content
    )
  ) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Invalid characters in splash'
      },
      400
    )
  }

  const exists = await db1
    .select()
    .from(berryDashSplashTexts)
    .where(eq(berryDashSplashTexts.content, btoa(body.content)))
    .limit(1)
    .execute()

  if (exists[0]) {
    return jsonResponse(
      {
        success: false,
        message: 'That splash text already exists, accepted or denied.'
      },
      409
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
  await db1
    .insert(berryDashSplashTexts)
    .values({ userId, content: btoa(body.content), timestamp: time })

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
