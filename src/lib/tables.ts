import {
  bigint,
  boolean,
  int,
  longtext,
  mysqlTable,
  text,
  tinyint,
  varchar
} from 'drizzle-orm/mysql-core'

// lncvrtgames

export const users = mysqlTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement().notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  password: varchar('password', { length: 60 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  latestIp: varchar('latest_ip', { length: 255 }),
  registerTime: bigint('register_time', { mode: 'number' }).notNull(),
  leaderboardsBanned: boolean('leaderboards_banned').default(false).notNull()
})

export const launcherUpdates = mysqlTable('launcherupdates', {
  id: varchar('id', { length: 24 }).primaryKey().notNull(),
  releaseDate: bigint('releaseDate', { mode: 'number' }).notNull(),
  downloadUrls: text('downloadUrls').notNull(),
  platforms: text('platforms').notNull(),
  executables: text('executables').notNull(),
  hidden: boolean('hidden').default(false).notNull(),
  place: bigint('place', { mode: 'number' }).default(0).notNull(),
  sha512sums: text('sha512sums').default('[]').notNull()
})

export const loaderUpdates = mysqlTable('loaderupdates', {
  id: varchar('id', { length: 24 }).primaryKey().notNull(),
  releaseDate: bigint('releaseDate', { mode: 'number' }).notNull(),
  hidden: boolean('hidden').default(false).notNull(),
  place: bigint('place', { mode: 'number' }).default(0).notNull()
})

export const games = mysqlTable('games', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement().notNull(),
  name: text('name').notNull(),
  official: boolean('official').default(false).notNull(),
  verified: boolean('verified').default(false).notNull(),
  developer: varchar('developer', { length: 32 })
})

export const launcherVersionManifest = mysqlTable('launcherversionmanifest', {
  id: varchar('id', { length: 24 }).primaryKey().notNull(),
  versionName: text('versionName').notNull(),
  releaseDate: bigint('releaseDate', { mode: 'number' }).notNull(),
  downloadUrls: text('downloadUrls').notNull(),
  platforms: text('platforms').notNull(),
  executables: text('executables').notNull(),
  hidden: boolean('hidden').default(false).notNull(),
  game: bigint('game', { mode: 'number' })
    .default(0)
    .references(() => games.id)
    .notNull(),
  place: bigint('place', { mode: 'number' }).default(0).notNull(),
  sha512sums: text('sha512sums').default('[]').notNull(),
  sizes: text('sizes').default('[]').notNull(),
  changelog: text('changelog')
})

export const verifyCodes = mysqlTable('verifycodes', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement().notNull(),
  code: varchar('code', { length: 16 }).notNull(),
  ip: varchar('ip', { length: 255 }),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  usedTimestamp: bigint('usedTimestamp', { mode: 'number' })
    .default(0)
    .notNull()
})

export const resetCodes = mysqlTable('resetcodes', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement().notNull(),
  code: varchar('code', { length: 64 }).notNull(),
  userId: bigint('userId', { mode: 'number' }).notNull(),
  ip: varchar('ip', { length: 255 }),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  usedTimestamp: bigint('usedTimestamp', { mode: 'number' })
    .default(0)
    .notNull(),
  type: int('type').notNull()
})

// berrydashdatabase

export const berryDashUserData = mysqlTable('userdata', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement().notNull(),
  token: varchar('token', { length: 512 }).notNull(),
  saveData: longtext('save_data').default('{}').notNull(),
  legacyHighScore: bigint('legacy_high_score', { mode: 'number' })
    .default(0)
    .notNull()
})

export const berryDashUserPosts = mysqlTable('userposts', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement().notNull(),
  userId: bigint('userId', { mode: 'number' }).notNull(),
  content: text('content').notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  deletedAt: bigint('deleted_at', { mode: 'number' }).default(0).notNull(),
  votes: text('votes').default('{}').notNull()
})

export const berryDashChats = mysqlTable('chats', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement().notNull(),
  userId: bigint('userId', { mode: 'number' }).notNull(),
  content: longtext('content').notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  deletedAt: bigint('deleted_at', { mode: 'number' }).default(0).notNull()
})

export const berryDashChatroomReports = mysqlTable('chatroom_reports', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement().notNull(),
  chatId: bigint('chatId', { mode: 'number' })
    .references(() => berryDashChats.id)
    .notNull(),
  userId: bigint('userId', { mode: 'number' }).notNull(),
  reason: longtext('reason').notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull()
})

export const berryDashMarketplaceIcons = mysqlTable('marketplaceicons', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement().notNull(),
  uuid: varchar('uuid', { length: 36 }).notNull(),
  userId: bigint('userId', { mode: 'number' }).notNull(),
  data: longtext('data').notNull(),
  hash: varchar('hash', { length: 128 }).notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  state: tinyint('state').default(0).notNull(),
  price: bigint('price', { mode: 'number' }).default(0).notNull(),
  name: text('name').notNull()
})
