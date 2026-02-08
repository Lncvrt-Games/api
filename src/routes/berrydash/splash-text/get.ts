import { getDatabaseConnection } from '../../../lib/util'
import { berryDashSplashTexts } from '../../../lib/tables'
import { eq } from 'drizzle-orm'

export const handler = async () => {
  const dbInfo1 = getDatabaseConnection(1)

  if (!dbInfo1)
    return new Response('', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  const { connection: connection1, db: db1 } = dbInfo1

  const result = await db1
    .select({
      content: berryDashSplashTexts.content
    })
    .from(berryDashSplashTexts)
    .where(eq(berryDashSplashTexts.state, 1))
    .execute()

  connection1.end()

  return new Response(result.map(i => atob(i.content)).join('\n'), {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  })
}
