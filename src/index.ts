import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jsonResponse } from './lib/util'
import dotenv from 'dotenv'

import { handler as canLoadClientHandler } from './routes/can-load-client'
import { handler as launcherVersionsHandler } from './routes/launcher/versions'
import { handler as launcherLatestHandler } from './routes/launcher/latest'
import { handler as launcherLoaderLatestHandler } from './routes/launcher/loader/latest'
import { handler as launcherLoaderUpdateDataHandler } from './routes/launcher/loader/update-data'
import { handler as berrydashLeaderboardsHandler } from './routes/berrydash/leaderboards'
import { handler as berrydashProfilePostsGetHandler } from './routes/berrydash/profile/posts/get'
import { handler as berrydashProfilePostsDeleteHandler } from './routes/berrydash/profile/posts/delete'

dotenv.config()

const app = new Elysia().use(
  cors({
    origin: '*',
    methods: ['POST', 'GET']
  })
)

app.get('/can-load-client', context => canLoadClientHandler(context))
app.get('/launcher/versions', context => launcherVersionsHandler(context))
app.get('/launcher/latest', launcherLatestHandler)
app.get('/launcher/loader/latest', launcherLoaderLatestHandler)
app.get('/launcher/loader/update-data', context =>
  launcherLoaderUpdateDataHandler(context)
)
app.get('/berrydash/leaderboards/score', context =>
  berrydashLeaderboardsHandler(context, 0)
)
app.get('/berrydash/leaderboards/berry', context =>
  berrydashLeaderboardsHandler(context, 1)
)
app.get('/berrydash/leaderboards/coin', context =>
  berrydashLeaderboardsHandler(context, 2)
)
app.get('/berrydash/leaderboards/legacy', context =>
  berrydashLeaderboardsHandler(context, 3)
)
app.get('/berrydash/leaderboards/total', context =>
  berrydashLeaderboardsHandler(context, 4)
)
app.get('/berrydash/profile/posts', context =>
  berrydashProfilePostsGetHandler(context)
)
app.delete('/berrydash/profile/posts', context =>
  berrydashProfilePostsDeleteHandler(context)
)
app.all('*', () =>
  jsonResponse(
    {
      success: false,
      message: 'No endpoint found (are you using the correct request method?)',
      data: null
    },
    404
  )
)

app.listen(3342)
