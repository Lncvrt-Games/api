import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jsonResponse } from './lib/util'
import dotenv from 'dotenv'
import swagger from '@elysiajs/swagger'

import { handler as canLoadClientHandler } from './routes/can-load-client'

import { handler as launcherVersionsHandler } from './routes/launcher/versions'
import { handler as launcherLatestHandler } from './routes/launcher/latest'
import { handler as launcherLoaderLatestHandler } from './routes/launcher/loader/latest'
import { handler as launcherLoaderUpdateDataHandler } from './routes/launcher/loader/update-data'

import { handler as berrydashLeaderboardsGetHandler } from './routes/berrydash/leaderboards/get'

import { handler as berrydashProfileGetHandler } from './routes/berrydash/profile/get'
import { handler as berrydashProfilePostsDeleteHandler } from './routes/berrydash/profile/posts/delete'
import { handler as berrydashProfilePostsGetHandler } from './routes/berrydash/profile/posts/get'
import { handler as berrydashProfilePostsPostHandler } from './routes/berrydash/profile/posts/post'
import { handler as berrydashProfilePostsPutHandler } from './routes/berrydash/profile/posts/put'

import { handler as berryDashIconMarketplacePostHandler } from './routes/berrydash/icon-marketplace/post'

dotenv.config()

const intNotStr = (name: string) => {
  return (
    '\n\n**The type for parameter `' +
    name +
    '` is actually a `number`, but it shows as a `string` here.**'
  )
}

const boolNotStr = (name: string) => {
  return (
    '\n\n**The type for parameter `' +
    name +
    '` is actually a `boolean`, but it shows as a `string` here.**'
  )
}

const app = new Elysia({ prefix: '/api' })
  .use(
    cors({
      origin: '*',
      methods: ['POST', 'GET']
    })
  )
  .use(
    swagger({
      path: '/docs',
      documentation: {
        info: {
          title: 'Lncvrt Games API',
          description:
            'This is the official documentation for the Lncvrt Games API!',
          version: '1.0.0'
        }
      }
    })
  )

app.get('/can-load-client', context => canLoadClientHandler(context))
app.get('/launcher/versions', context => launcherVersionsHandler(context), {
  detail: {
    description:
      'The endpoint for getting the launcher manifest.\n\nNote: if going to use the params, both must be provided at the same time.',
    tags: ['Launcher']
  },
  query: t.Object({
    platform: t.Optional(t.String()),
    arch: t.Optional(t.String())
  })
})
app.get('/launcher/latest', launcherLatestHandler, {
  detail: {
    description: 'The endpoint for getting the latest launcher version.',
    tags: ['Launcher']
  }
})
app.get('/launcher/loader/latest', launcherLoaderLatestHandler, {
  detail: {
    description:
      'The endpoint for getting the latest loader/auto updater version.',
    tags: ['Launcher']
  }
})
app.get(
  '/launcher/loader/update-data',
  context => launcherLoaderUpdateDataHandler(context),
  {
    detail: {
      description:
        'The endpoint for getting Launcher Update data for when a new Update is released. It will be send & read by the updater.\n\nNote: if going to use the params, both must be provided at the same time.',
      tags: ['Launcher']
    },
    query: t.Object({
      platform: t.Optional(t.String()),
      arch: t.Optional(t.String())
    })
  }
)
app.get(
  '/berrydash/leaderboards/score',
  context => berrydashLeaderboardsGetHandler(context, 0),
  {
    detail: {
      description: 'The endpoint for getting the score leaderboards.',
      tags: ['Berry Dash', 'Leaderboards']
    }
  }
)
app.get(
  '/berrydash/leaderboards/berry',
  context => berrydashLeaderboardsGetHandler(context, 1),
  {
    detail: {
      description:
        'The endpoint for getting the berry leaderboards.' + intNotStr('berry'),
      tags: ['Berry Dash', 'Leaderboards']
    },
    query: t.Object({
      berry: t.String()
    })
  }
)
app.get(
  '/berrydash/leaderboards/coin',
  context => berrydashLeaderboardsGetHandler(context, 2),
  {
    detail: {
      description: 'The endpoint for getting the coin leaderboards.',
      tags: ['Berry Dash', 'Leaderboards']
    }
  }
)
app.get(
  '/berrydash/leaderboards/legacy',
  context => berrydashLeaderboardsGetHandler(context, 3),
  {
    detail: {
      description: 'The endpoint for getting the legacy leaderboards.',
      tags: ['Berry Dash', 'Leaderboards']
    }
  }
)
app.get(
  '/berrydash/leaderboards/total',
  context => berrydashLeaderboardsGetHandler(context, 4),
  {
    detail: {
      description: 'The endpoint for getting the total leaderboards.',
      tags: ['Berry Dash', 'Leaderboards']
    }
  }
)
app.get('/berrydash/profile', context => berrydashProfileGetHandler(context), {
  detail: {
    description:
      "The endpoint for getting a user's profile." + intNotStr('userId'),
    tags: ['Berry Dash', 'Profiles']
  },
  query: t.Object({
    userId: t.String()
  })
})
app.delete(
  '/berrydash/profile/posts',
  context => berrydashProfilePostsDeleteHandler(context),
  {
    detail: {
      description: 'This endpoint is for deleting a post.' + intNotStr('id'),
      tags: ['Berry Dash', 'Profiles']
    },
    headers: t.Object({
      authorization: t.String()
    }),
    query: t.Object({
      id: t.String()
    })
  }
)
app.get(
  '/berrydash/profile/posts',
  context => berrydashProfilePostsGetHandler(context),
  {
    detail: {
      description:
        'This endpoint is for getting posts from a user.' + intNotStr('userId'),
      tags: ['Berry Dash', 'Profiles']
    },
    query: t.Object({
      userId: t.String()
    })
  }
)
app.post(
  '/berrydash/profile/posts',
  context => berrydashProfilePostsPostHandler(context),
  {
    detail: {
      description: 'This endpoint is for uploading a new post.',
      tags: ['Berry Dash', 'Profiles']
    },
    body: t.Object({
      content: t.String()
    })
  }
)
app.put(
  '/berrydash/profile/posts',
  context => berrydashProfilePostsPutHandler(context),
  {
    detail: {
      description:
        'This endpoint is for liking/disliking a post.' +
        intNotStr('id') +
        boolNotStr('likedQuery'),
      tags: ['Berry Dash', 'Profiles']
    },
    query: t.Object({
      id: t.String(),
      likedQuery: t.String()
    })
  }
)
app.post(
  '/berrydash/icon-marketplace',
  context => berryDashIconMarketplacePostHandler(context),
  {
    detail: {
      description:
        'The endpoint for getting the icon marketplace icons.\n\nPretty much none of the body types are correct.',
      tags: ['Berry Dash', 'Icon Marketplace']
    },
    body: t.Object({
      sortBy: t.String(),
      priceRangeEnabled: t.String(),
      priceRangeMin: t.String(),
      priceRangeMax: t.String(),
      searchForEnabled: t.String(),
      searchForValue: t.String(),
      onlyShowEnabled: t.String(),
      onlyShowValue: t.String(),
      currentIcons: t.String()
    })
  }
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
