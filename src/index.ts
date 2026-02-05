import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { ElysiaWS } from 'elysia/dist/ws'
import { getDatabaseConnection, jsonResponse } from './lib/util'
import dotenv from 'dotenv'
import swagger from '@elysiajs/swagger'
import { berryDashChats, berryDashUserData, users } from './lib/tables'
import { and, desc, eq } from 'drizzle-orm'
import { checkAuthorization } from './lib/auth'

import { handler as getVerifyCodeHandler } from './routes/get-verify-code'

import { handler as canLoadClientHandler } from './routes/can-load-client'

import { handler as launcherVersionsHandler } from './routes/launcher/versions'
import { handler as launcherLatestHandler } from './routes/launcher/latest'
import { handler as launcherDownloadHandler } from './routes/launcher/download'
import { handler as launcherLoaderLatestHandler } from './routes/launcher/loader/latest'
import { handler as launcherLoaderUpdateDataHandler } from './routes/launcher/loader/update-data'

import { handler as accountLoginPostHandler } from './routes/account/login/post'
import { handler as accountRegisterPostHandler } from './routes/account/register/post'
import { handler as accountChangeUsernamePostHandler } from './routes/account/change-username/post'
import { handler as accountChangePasswordPostHandler } from './routes/account/change-password/post'
import { handler as accountForgotUsernamePostHandler } from './routes/account/forgot-username/post'
import { handler as accountForgotPasswordPostHandler } from './routes/account/forgot-password/post'
import { handler as accountResetPasswordPostHandler } from './routes/account/reset-password/post'

import { handler as berryDashLatestVersionGetHandler } from './routes/berrydash/latest-version/get'

import { handler as berrydashLeaderboardGetHandler } from './routes/berrydash/leaderboard/get'

import { handler as berrydashProfileGetHandler } from './routes/berrydash/profile/get'
import { handler as berrydashProfilePostsDeleteHandler } from './routes/berrydash/profile/posts/delete'
import { handler as berrydashProfilePostsGetHandler } from './routes/berrydash/profile/posts/get'
import { handler as berrydashProfilePostsPostHandler } from './routes/berrydash/profile/posts/post'
import { handler as berrydashProfilePostsPutHandler } from './routes/berrydash/profile/posts/put'

import { handler as berryDashIconMarketplaceGetHandler } from './routes/berrydash/icon-marketplace/get'
import { handler as berryDashIconMarketplacePostHandler } from './routes/berrydash/icon-marketplace/post'
import { handler as berryDashIconMarketplaceUploadPostHandler } from './routes/berrydash/icon-marketplace/upload/post'
import { handler as berryDashIconMarketplaceIconGetHandler } from './routes/berrydash/icon-marketplace/icon/get'

import { handler as berryDashAccountGetHandler } from './routes/berrydash/account/get'
import { handler as berryDashAccountSaveGetHandler } from './routes/berrydash/account/save/get'
import { handler as berryDashAccountSavePostHandler } from './routes/berrydash/account/save/post'

import { handler as berryDashChatroomReportPostHandler } from './routes/berrydash/chatroom/report/post'

import { handler as berryDashSplashTextGetHandler } from './routes/berrydash/splash-text/get'
import { handler as berryDashSplashTextPostHandler } from './routes/berrydash/splash-text/post'

dotenv.config({ quiet: true })

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

const app = new Elysia({
  prefix: '/api',
  websocket: {
    idleTimeout: 10,
    maxPayloadLength: 8192
  }
})
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

const clients = new Set<ElysiaWS>()

app.ws('/ws', {
  maxPayloadLength: 10 * 1024 * 1024,
  open (ws) {
    clients.add(ws)
    console.log(ws.id, 'connected')
  },
  async message (ws, message: any) {
    console.log('received:', message, 'from', ws.id)
    if (message.type) {
      if (message.type == 'edit') {
        if (
          message.kind &&
          message.kind == 'chatroom_message' &&
          message.data &&
          message.data.id &&
          message.data.newContent &&
          message.data.auth
        ) {
          const dbInfo0 = getDatabaseConnection(0)
          const dbInfo1 = getDatabaseConnection(1)

          if (!dbInfo0 || !dbInfo1) return
          const { connection: connection0, db: db0 } = dbInfo0
          const { connection: connection1, db: db1 } = dbInfo1

          const ip = ws.remoteAddress
          const authResult = await checkAuthorization(
            message.data.auth as string,
            db0,
            ip
          )
          if (!authResult.valid) {
            connection0.end()
            connection1.end()
            return
          }
          const userId = authResult.id
          const time = Math.floor(Date.now() / 1000)

          const result = await db1
            .update(berryDashChats)
            .set({
              content: btoa(message.data.newContent),
              editedAt: time
            })
            .where(
              and(
                eq(berryDashChats.id, message.data.id as number),
                eq(berryDashChats.userId, userId)
              )
            )
            .execute()

          if (result[0].affectedRows == 1) {
            for (const client of clients) {
              client.send(
                JSON.stringify({
                  for: message.type + ':' + message.kind,
                  data: {
                    id: message.data.id as number,
                    newContent: message.data.newContent as string,
                    editedAt: time
                  }
                })
              )
            }
          }

          connection0.end()
          connection1.end()
        }
      } else if (message.type == 'delete') {
        if (
          message.kind &&
          message.kind == 'chatroom_message' &&
          message.data &&
          message.data.id &&
          message.data.auth
        ) {
          const dbInfo0 = getDatabaseConnection(0)
          const dbInfo1 = getDatabaseConnection(1)

          if (!dbInfo0 || !dbInfo1) return
          const { connection: connection0, db: db0 } = dbInfo0
          const { connection: connection1, db: db1 } = dbInfo1

          const ip = ws.remoteAddress
          const authResult = await checkAuthorization(
            message.data.auth as string,
            db0,
            ip
          )
          if (!authResult.valid) {
            connection0.end()
            connection1.end()
            return
          }
          const userId = authResult.id
          const time = Math.floor(Date.now() / 1000)

          const result = await db1
            .update(berryDashChats)
            .set({
              deletedAt: time
            })
            .where(
              and(
                eq(berryDashChats.id, message.data.id as number),
                eq(berryDashChats.userId, userId)
              )
            )
            .execute()

          if (result[0].affectedRows == 1) {
            const chatRows = await db1
              .select({
                id: berryDashChats.id,
                content: berryDashChats.content,
                userId: berryDashChats.userId,
                timestamp: berryDashChats.timestamp,
                editedAt: berryDashChats.editedAt
              })
              .from(berryDashChats)
              .limit(50)
              .where(eq(berryDashChats.deletedAt, 0))
              .orderBy(desc(berryDashChats.id))
              .execute()

            if (!chatRows.reverse()[0])
              for (const client of clients) {
                client.send(
                  JSON.stringify({
                    for: message.type + ':' + message.kind,
                    data: {
                      id: message.data.id as number,
                      fillerMessage: null
                    }
                  })
                )
              }
            const chat = chatRows[0]

            const userData = await db1
              .select({
                legacyHighScore: berryDashUserData.legacyHighScore,
                saveData: berryDashUserData.saveData
              })
              .from(berryDashUserData)
              .where(eq(berryDashUserData.id, chat.userId))
              .limit(1)
              .execute()
            if (!userData[0])
              for (const client of clients) {
                client.send(
                  JSON.stringify({
                    for: message.type + ':' + message.kind,
                    data: {
                      id: message.data.id as number,
                      fillerMessage: null
                    }
                  })
                )
              }

            const userInfo = await db0
              .select({ username: users.username })
              .from(users)
              .where(eq(users.id, chat.userId))
              .limit(1)
              .execute()

            let savedata = JSON.parse(userData[0].saveData)

            for (const client of clients) {
              client.send(
                JSON.stringify({
                  for: message.type + ':' + message.kind,
                  data: {
                    id: message.data.id as number,
                    fillerMessage: {
                      username: userInfo[0].username,
                      userId: chat.userId,
                      content: atob(chat.content),
                      id: chat.id,
                      icon: savedata?.bird?.icon ?? 1,
                      overlay: savedata?.bird?.overlay ?? 0,
                      birdColor: savedata?.settings?.colors?.icon ?? [
                        255, 255, 255
                      ],
                      overlayColor: savedata?.settings?.colors?.overlay ?? [
                        255, 255, 255
                      ],
                      customIcon: savedata?.bird?.customIcon?.selected ?? null,
                      timestamp: chat.timestamp,
                      editedAt: chat.editedAt
                    }
                  }
                })
              )
            }
          }

          connection0.end()
          connection1.end()
        }
      } else if (message.type == 'upload') {
        if (
          message.kind &&
          message.kind == 'chatroom_message' &&
          message.data &&
          message.data.content &&
          message.data.auth
        ) {
          if (
            !/^[ a-zA-Z0-9!@#\$%\^&\*\(\)_\+\-=\[\]\{\};\':",\.<>\/\?\\\\|`~]+$/.test(
              message.data.content
            )
          )
            return
          const dbInfo0 = getDatabaseConnection(0)
          const dbInfo1 = getDatabaseConnection(1)

          if (!dbInfo0 || !dbInfo1) return
          const { connection: connection0, db: db0 } = dbInfo0
          const { connection: connection1, db: db1 } = dbInfo1

          const ip = ws.remoteAddress
          const authResult = await checkAuthorization(
            message.data.auth as string,
            db0,
            ip
          )
          if (!authResult.valid) {
            connection0.end()
            connection1.end()
            return
          }
          const userId = authResult.id
          const time = Math.floor(Date.now() / 1000)

          const insert = await db1
            .insert(berryDashChats)
            .values({
              userId,
              content: btoa(message.data.content as string),
              timestamp: time
            })
            .execute()

          const userData = await db1
            .select({
              legacyHighScore: berryDashUserData.legacyHighScore,
              saveData: berryDashUserData.saveData
            })
            .from(berryDashUserData)
            .where(eq(berryDashUserData.id, userId))
            .limit(1)
            .execute()
          if (!userData[0]) {
            connection0.end()
            connection1.end()
            return
          }

          const userInfo = await db0
            .select({ username: users.username })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .execute()
          if (!userInfo[0]) {
            connection0.end()
            connection1.end()
            return
          }

          let savedata = JSON.parse(userData[0].saveData)

          for (const client of clients) {
            client.send(
              JSON.stringify({
                for: message.type + ':' + message.kind,
                data: {
                  username: userInfo[0].username,
                  userId,
                  content: message.data.content as string,
                  id: insert[0].insertId,
                  icon: savedata?.bird?.icon ?? 1,
                  overlay: savedata?.bird?.overlay ?? 0,
                  birdColor: savedata?.settings?.colors?.icon ?? [
                    255, 255, 255
                  ],
                  overlayColor: savedata?.settings?.colors?.overlay ?? [
                    255, 255, 255
                  ],
                  customIcon: savedata?.bird?.customIcon?.selected ?? null,
                  timestamp: time,
                  editedAt: 0
                }
              })
            )
          }

          connection0.end()
          connection1.end()
        }
      } else if (message.type == 'info_request') {
        if (message.kind && message.kind == 'chatroom_messages') {
          const dbInfo0 = getDatabaseConnection(0)
          const dbInfo1 = getDatabaseConnection(1)

          if (!dbInfo0 || !dbInfo1)
            return ws.send(
              JSON.stringify({
                for: message.type + ':' + message.kind,
                success: false,
                message: 'Failed to get messages',
                data: null
              })
            )
          const { connection: connection0, db: db0 } = dbInfo0
          const { connection: connection1, db: db1 } = dbInfo1

          const chats = await db1
            .select({
              id: berryDashChats.id,
              content: berryDashChats.content,
              userId: berryDashChats.userId,
              timestamp: berryDashChats.timestamp,
              editedAt: berryDashChats.editedAt
            })
            .from(berryDashChats)
            .limit(50)
            .where(eq(berryDashChats.deletedAt, 0))
            .orderBy(desc(berryDashChats.id))
            .execute()

          let mapped: Record<string, unknown>[] = []
          for (const chat of chats.reverse()) {
            const userData = await db1
              .select({
                legacyHighScore: berryDashUserData.legacyHighScore,
                saveData: berryDashUserData.saveData
              })
              .from(berryDashUserData)
              .where(eq(berryDashUserData.id, chat.userId))
              .limit(1)
              .execute()
            if (!userData[0]) continue

            const userInfo = await db0
              .select({ username: users.username })
              .from(users)
              .where(eq(users.id, chat.userId))
              .limit(1)
              .execute()

            let savedata = JSON.parse(userData[0].saveData)

            mapped.push({
              username: userInfo[0].username,
              userId: chat.userId,
              content: atob(chat.content),
              id: chat.id,
              icon: savedata?.bird?.icon ?? 1,
              overlay: savedata?.bird?.overlay ?? 0,
              birdColor: savedata?.settings?.colors?.icon ?? [255, 255, 255],
              overlayColor: savedata?.settings?.colors?.overlay ?? [
                255, 255, 255
              ],
              customIcon: savedata?.bird?.customIcon?.selected ?? null,
              timestamp: chat.timestamp,
              editedAt: chat.editedAt
            })
          }

          connection0.end()
          connection1.end()

          ws.send(
            JSON.stringify({
              for: message.type + ':' + message.kind,
              success: true,
              message: null,
              data: mapped
            })
          )
        }
      }
    }
  },
  close (ws) {
    clients.forEach(client => {
      if (client.id === ws.id) clients.delete(client)
    })

    console.log(ws.id, 'disconnected')
  }
})

app.post('/get-verify-code', context => getVerifyCodeHandler(context), {
  detail: {
    hide: true //This endpoint can only be used by the website.
  },
  body: t.Object({
    token: t.String()
  }),
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
})
app.get('/can-load-client', context => canLoadClientHandler(context), {
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
})
app.get('/launcher/versions', context => launcherVersionsHandler(context), {
  detail: {
    description:
      'The endpoint for getting the launcher manifest.\n\nNote: if going to use the params, both must be provided at the same time.',
    tags: ['Launcher']
  },
  query: t.Object({
    platform: t.Optional(t.String({ examples: ['windows', 'macos', 'linux'] })),
    arch: t.Optional(t.String({ examples: ['x86_64', 'aarch64'] }))
  }),
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
})
app.get('/launcher/latest', launcherLatestHandler, {
  detail: {
    description: 'The endpoint for getting the latest launcher version.',
    tags: ['Launcher']
  },
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
})
app.get('/launcher/download', context => launcherDownloadHandler(context), {
  detail: {
    hide: true
  },
  query: t.Object({
    id: t.String()
  }),
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
})
app.get('/launcher/loader/latest', launcherLoaderLatestHandler, {
  detail: {
    description:
      'The endpoint for getting the latest loader/auto updater version.',
    tags: ['Launcher']
  },
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
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
      platform: t.Optional(
        t.String({ examples: ['windows', 'macos', 'linux'] })
      ),
      arch: t.Optional(t.String({ examples: ['x86_64', 'aarch64'] }))
    }),
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.post('/account/login', context => accountLoginPostHandler(context), {
  detail: {
    description:
      'The endpoint for logging into an account. This is also the endpoint for refreshing login.',
    tags: ['Accounts']
  },
  body: t.Object({
    username: t.String(),
    password: t.String()
  }),
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        description:
          'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
      })
    )
  })
})
app.post('/account/register', context => accountRegisterPostHandler(context), {
  detail: {
    description: 'The endpoint for registering an account.',
    tags: ['Accounts']
  },
  body: t.Object({
    token: t.Optional(t.String()),
    verifyCode: t.Optional(t.String()),
    username: t.String(),
    password: t.String(),
    email: t.String()
  }),
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        description:
          'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
      })
    )
  })
})
app.post(
  '/account/change-username',
  context => accountChangeUsernamePostHandler(context),
  {
    detail: {
      description: "The endpoint for changing the account's user name.",
      tags: ['Accounts']
    },
    body: t.Object({
      newUsername: t.String()
    }),
    headers: t.Object({
      authorization: t.String({
        description: 'This is your session token'
      }),
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.post(
  '/account/change-password',
  context => accountChangePasswordPostHandler(context),
  {
    detail: {
      description: "The endpoint for changing the account's password.",
      tags: ['Accounts']
    },
    body: t.Object({
      newPassword: t.String()
    }),
    headers: t.Object({
      authorization: t.String({
        description: 'This is your session token'
      }),
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.post('/account/forgot-username', accountForgotUsernamePostHandler, {
  detail: {
    description: 'The endpoint for retreiving the username for an account.',
    tags: ['Accounts']
  },
  body: t.Object({
    token: t.Optional(t.String()),
    verifyCode: t.Optional(t.String()),
    email: t.String()
  }),
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
})
app.post('/account/forgot-password', accountForgotPasswordPostHandler, {
  detail: {
    description: 'The endpoint for retreiving the password for an account.',
    tags: ['Accounts']
  },
  body: t.Object({
    token: t.Optional(t.String()),
    verifyCode: t.Optional(t.String()),
    email: t.String()
  }),
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
})
app.post('/account/reset-password', accountResetPasswordPostHandler, {
  detail: {
    hide: true
  },
  body: t.Object({
    token: t.Optional(t.String()),
    verifyCode: t.Optional(t.String()),
    code: t.String(),
    password: t.String()
  }),
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
})
app.get('/berrydash/latest-version', berryDashLatestVersionGetHandler, {
  detail: {
    description: 'The endpoint for getting the latest berry dash version.',
    tags: ['Berry Dash']
  },
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
})
app.get(
  '/berrydash/leaderboards/score',
  context => berrydashLeaderboardGetHandler(context, 0),
  {
    detail: {
      deprecated: true,
      description:
        'This endpoint was renamed to `/berrydash/leaderboard/score` and will be removed on March 19th 2026.',
      tags: ['Berry Dash', 'Leaderboards']
    },
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get(
  '/berrydash/leaderboards/berry',
  context => berrydashLeaderboardGetHandler(context, 1),
  {
    detail: {
      deprecated: true,
      description:
        'This endpoint was renamed to `/berrydash/leaderboard/berry` and will be removed on March 19th 2026.',
      tags: ['Berry Dash', 'Leaderboards']
    },
    query: t.Object({
      berry: t.String()
    }),
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get(
  '/berrydash/leaderboards/coin',
  context => berrydashLeaderboardGetHandler(context, 2),
  {
    detail: {
      deprecated: true,
      description:
        'This endpoint was renamed to `/berrydash/leaderboard/coin` and will be removed on March 19th 2026.',
      tags: ['Berry Dash', 'Leaderboards']
    },
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get(
  '/berrydash/leaderboards/legacy',
  context => berrydashLeaderboardGetHandler(context, 3),
  {
    detail: {
      deprecated: true,
      description:
        'This endpoint was renamed to `/berrydash/leaderboard/legacy` and will be removed on March 19th 2026.',
      tags: ['Berry Dash', 'Leaderboards']
    },
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get(
  '/berrydash/leaderboards/total',
  context => berrydashLeaderboardGetHandler(context, 4),
  {
    detail: {
      deprecated: true,
      description:
        'This endpoint was renamed to `/berrydash/leaderboard/total` and will be removed on March 19th 2026.',
      tags: ['Berry Dash', 'Leaderboards']
    },
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get(
  '/berrydash/leaderboard/score',
  context => berrydashLeaderboardGetHandler(context, 0),
  {
    detail: {
      description: 'The endpoint for getting the score leaderboards.',
      tags: ['Berry Dash', 'Leaderboards']
    },
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get(
  '/berrydash/leaderboard/berry',
  context => berrydashLeaderboardGetHandler(context, 1),
  {
    detail: {
      description:
        'The endpoint for getting the berry leaderboards.' + intNotStr('berry'),
      tags: ['Berry Dash', 'Leaderboards']
    },
    query: t.Object({
      berry: t.String({ examples: ['0', '1', '2', '3', '4', '5', '6', '7'] })
    }),
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get(
  '/berrydash/leaderboard/coin',
  context => berrydashLeaderboardGetHandler(context, 2),
  {
    detail: {
      description: 'The endpoint for getting the coin leaderboards.',
      tags: ['Berry Dash', 'Leaderboards']
    },
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get(
  '/berrydash/leaderboard/legacy',
  context => berrydashLeaderboardGetHandler(context, 3),
  {
    detail: {
      description: 'The endpoint for getting the legacy leaderboards.',
      tags: ['Berry Dash', 'Leaderboards']
    },
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get(
  '/berrydash/leaderboard/total',
  context => berrydashLeaderboardGetHandler(context, 4),
  {
    detail: {
      description: 'The endpoint for getting the total leaderboards.',
      tags: ['Berry Dash', 'Leaderboards']
    },
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
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
  }),
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
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
    query: t.Object({
      id: t.String()
    }),
    headers: t.Object({
      authorization: t.String({
        description: 'This is your session token'
      }),
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
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
    }),
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
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
    }),
    headers: t.Object({
      authorization: t.String({
        description: 'This is your session token'
      }),
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
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
      liked: t.String()
    }),
    headers: t.Object({
      authorization: t.String({
        description: 'This is your session token'
      }),
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get(
  '/berrydash/icon-marketplace',
  context => berryDashIconMarketplaceGetHandler(context),
  {
    detail: {
      description: 'The endpoint for getting the icon marketplace icons.',
      tags: ['Berry Dash', 'Icon Marketplace']
    },
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.post(
  '/berrydash/icon-marketplace',
  context => berryDashIconMarketplacePostHandler(context),
  {
    detail: {
      description:
        'The endpoint for getting the icon marketplace icons with filters.\n\nPretty much none of the body types are correct.',
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
    }),
    headers: t.Object({
      authorization: t.Optional(
        t.String({
          description: 'This is your session token'
        })
      ),
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.post(
  '/berrydash/icon-marketplace/upload',
  context => berryDashIconMarketplaceUploadPostHandler(context),
  {
    detail: {
      description:
        'The endpoint for uploading an icon to the icon marketplace.\n\n`verifyCode` or `token` must be provided.',
      tags: ['Berry Dash', 'Icon Marketplace']
    },
    body: t.Object({
      token: t.Optional(t.String()),
      verifyCode: t.Optional(t.String()),
      price: t.String(),
      name: t.String(),
      fileContent: t.String()
    }),
    headers: t.Object({
      authorization: t.String({
        description: 'This is your session token'
      }),
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get(
  '/berrydash/icon-marketplace/icon',
  context => berryDashIconMarketplaceIconGetHandler(context),
  {
    detail: {
      description: 'The endpoint for getting a specific icon marketplace icon.',
      tags: ['Berry Dash', 'Icon Marketplace']
    },
    query: t.Object({
      id: t.Optional(
        t.String(
          t.String({ description: 'The ID for the icon you want to get' })
        )
      ),
      ids: t.Optional(
        t.String(
          t.String({ description: 'The IDs for the icons you want to get' })
        )
      ),
      data: t.Optional(
        t.String({
          description:
            'If set to false, this will not include icon data, otherwise it will. Setting it to true would have the same result as not having it at all.',
          examples: ['true', 'false']
        })
      ),
      raw: t.Optional(
        t.String({
          description:
            'If you want to get a single icon (only works with `id`, not `ids`) then use this. It will act as if you went to a actual .png file. If provided, any value will mean it will act as a .png file'
        })
      )
    }),
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.post(
  '/berrydash/chatroom/report',
  context => berryDashChatroomReportPostHandler(context),
  {
    detail: {
      description: 'The endpoint for getting a specific icon marketplace icon.',
      tags: ['Berry Dash', 'Chatroom']
    },
    body: t.Object({
      id: t.String(),
      reason: t.String()
    }),
    headers: t.Object({
      authorization: t.String({
        description: 'This is your session token'
      }),
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get('/berrydash/account', context => berryDashAccountGetHandler(context), {
  detail: {
    description: 'The endpoint for getting a list of users',
    tags: ['Berry Dash', 'Accounts']
  },
  query: t.Object({
    username: t.String()
  }),
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        description:
          'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
      })
    )
  })
})
app.get(
  '/berrydash/account/save',
  context => berryDashAccountSaveGetHandler(context),
  {
    detail: {
      description:
        "The endpoint for getting the account's save file. The contents will fully replace the current save file entirely on the client.",
      tags: ['Berry Dash', 'Accounts']
    },
    headers: t.Object({
      authorization: t.String({
        description: 'This is your session token'
      }),
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.post(
  '/berrydash/account/save',
  context => berryDashAccountSavePostHandler(context),
  {
    detail: {
      description:
        "The endpoint for overwriting the account's save file on the server.",
      tags: ['Berry Dash', 'Accounts']
    },
    body: t.Object({
      saveData: t.String()
    }),
    headers: t.Object({
      authorization: t.String({
        description: 'This is your session token'
      }),
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)
app.get('/berrydash/splash-text', berryDashSplashTextGetHandler, {
  detail: {
    description: 'The endpoint for getting splash texts.',
    tags: ['Berry Dash', 'Splash Texts']
  },
  headers: t.Object({
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
})
app.post('/berrydash/splash-text', berryDashSplashTextPostHandler, {
  detail: {
    hide: true
  },
  body: t.Object({
    token: t.Optional(t.String()),
    verifyCode: t.Optional(t.String()),
    content: t.String()
  }),
  headers: t.Object({
    authorization: t.String(),
    'x-forwarded-for': t.Optional(
      t.String({
        hide: true
      })
    )
  })
})
app.all(
  '*',
  () =>
    jsonResponse(
      {
        success: false,
        message:
          'No endpoint found (are you using the correct request method?)',
        data: null
      },
      404
    ),
  {
    headers: t.Object({
      'x-forwarded-for': t.Optional(
        t.String({
          description:
            'Ignore this header. It cannot be set or overridden and is required for endpoints to work properly'
        })
      )
    })
  }
)

app.listen(3342)

console.log(
  `Lncvrt API Server started on http://${app.server?.hostname}:${app.server?.port}/api/`
)
