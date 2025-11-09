import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jsonResponse } from './lib/util'
import dotenv from 'dotenv'

import { handler as launcherVersionsHandler } from './routes/launcher/versions'
import { handler as launcherLatestHandler } from './routes/launcher/latest'
import { handler as launcherLoaderLatestHandler } from './routes/launcher/loader/latest'
import { handler as launcherLoaderUpdateDataHandler } from './routes/launcher/loader/update-data'

dotenv.config()

const app = new Elysia().use(
  cors({
    origin: '*',
    methods: ['POST', 'GET']
  })
)

app.get('/launcher/versions', context => launcherVersionsHandler(context))
app.get('/launcher/latest', launcherLatestHandler)
app.get('/launcher/loader/latest', launcherLoaderLatestHandler)
app.get('/launcher/loader/update-data', context =>
  launcherLoaderUpdateDataHandler(context)
)
app.all('*', () =>
  jsonResponse(
    {
      message: 'No endpoint found (are you using the correct request method?)'
    },
    404
  )
)

app.listen(3342)
