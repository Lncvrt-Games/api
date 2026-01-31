import { Context } from 'elysia'
import {
  getClientIp,
  getDatabaseConnection,
  hash,
  jsonResponse,
  validateTurnstile
} from '../../../../lib/util'
import { checkAuthorization } from '../../../../lib/auth'
import { berryDashMarketplaceIcons, verifyCodes } from '../../../../lib/tables'
import { and, desc, eq, sql } from 'drizzle-orm'
import { Buffer } from 'buffer'
import sizeOf from 'image-size'
import { Connection } from 'mysql2/typings/mysql/lib/Connection'

type Body = {
  verifyCode: string
  token: string
  price: string
  name: string
  fileContent: string
}

function exitBecauseInvalid (
  connection0: Connection,
  connection1: Connection,
  message: string
) {
  connection0.end()
  connection1.end()
  return jsonResponse(
    {
      success: false,
      message: message
    },
    400
  )
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
  if (!body.verifyCode && !body.token) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'verifyCode or token must be provided in POST data'
      },
      400
    )
  }
  const price = parseInt(body.price, 10)
  if (isNaN(price)) {
    connection0.end()
    connection1.end()
    return jsonResponse(
      {
        success: false,
        message: 'Failed to parse price'
      },
      400
    )
  }

  if (price < 10)
    return exitBecauseInvalid(
      connection0,
      connection1,
      'Price cannot be be under 10 coins'
    )
  if (!/^[a-zA-Z0-9 ]+$/.test(body.name) || body.name.length > 16)
    return exitBecauseInvalid(connection0, connection1, 'Name is invalid')
  const decoded = Buffer.from(body.fileContent, 'base64')
  if (!decoded)
    return exitBecauseInvalid(
      connection0,
      connection1,
      'Invalid image uploaded'
    )
  if (decoded.length > 1024 * 1024)
    return exitBecauseInvalid(
      connection0,
      connection1,
      'File size exceeds 1 MB limit'
    )
  const info = sizeOf(decoded)
  if (!info)
    return exitBecauseInvalid(
      connection0,
      connection1,
      'Invalid image uploaded'
    )
  if (info.type !== 'png')
    return exitBecauseInvalid(connection0, connection1, 'Image must be a PNG')
  if (info.width !== 128 || info.height !== 128)
    return exitBecauseInvalid(
      connection0,
      connection1,
      'Image has to be 128x128'
    )

  const time = Math.floor(Date.now() / 1000)
  if (body.verifyCode) {
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
        .execute()
    } else
      return jsonResponse(
        {
          success: false,
          message: 'Invalid verify code (codes can only be used once)'
        },
        400
      )
  } else {
    const result = await validateTurnstile(body.token, ip)
    if (!result.success) {
      connection0.end()
      return jsonResponse(
        {
          success: false,
          message: 'Unable to verify captcha key'
        },
        400
      )
    }
  }

  const hashResult = hash(atob(body.fileContent), 'sha512')
  const id = crypto.randomUUID()

  await db1.insert(berryDashMarketplaceIcons).values({
    id,
    userId,
    data: body.fileContent,
    hash: hashResult,
    price,
    name: btoa(body.name),
    timestamp: time
  })

  return jsonResponse({
    success: true,
    message: 'Icon uploaded successfully! It will be reviewed soon.'
  })
}
