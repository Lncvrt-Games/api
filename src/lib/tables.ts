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
  id: int('id').primaryKey().autoincrement().notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  password: varchar('password', { length: 60 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  latestIp: varchar('latest_ip', { length: 255 }),
  registerTime: int('register_time').notNull(),
  leaderboardsBanned: boolean('leaderboards_banned').default(false).notNull()
})

export const launcherUpdates = mysqlTable('launcherupdates', {
  id: varchar('id', { length: 24 }).primaryKey().notNull(),
  releaseDate: bigint('releaseDate', { mode: 'number' }).notNull(),
  downloadUrls: text('downloadUrls').notNull(),
  platforms: text('platforms').notNull(),
  executables: text('executables').notNull(),
  hidden: boolean('hidden').default(false).notNull(),
  place: int('place').default(0).notNull(),
  sha512sums: text('sha512sums').default('[]').notNull()
})

export const launcherGames = mysqlTable('launchergames', {
  id: int('id').primaryKey().autoincrement().notNull(),
  name: text('name').notNull(),
  official: boolean('official').default(false).notNull(),
  verified: boolean('verified').default(false).notNull(),
  developer: varchar('developer', { length: 32 }),
  cutOff: int('cutOff').default(-1)
})

export const launcherVersions = mysqlTable('launcherversions', {
  id: varchar('id', { length: 24 }).primaryKey().notNull(),
  versionName: text('versionName').notNull(),
  releaseDate: bigint('releaseDate', { mode: 'number' }).notNull(),
  downloadUrls: text('downloadUrls').notNull(),
  platforms: text('platforms').notNull(),
  executables: text('executables').notNull(),
  hidden: boolean('hidden').default(false).notNull(),
  game: int('game')
    .default(0)
    .references(() => launcherGames.id)
    .notNull(),
  place: int('place').default(0).notNull(),
  sha512sums: text('sha512sums').default('[]').notNull(),
  sizes: text('sizes').default('[]').notNull()
})

// berrydashdatabase

export const berryDashUserData = mysqlTable('userdata', {
  id: int('id').primaryKey().autoincrement().notNull(),
  token: varchar('token', { length: 512 }).notNull(),
  saveData: longtext('save_data').default('{}').notNull(),
  legacyHighScore: bigint('legacy_high_score', { mode: 'number' })
    .default(0)
    .notNull()
})

export const berryDashUserPosts = mysqlTable('userdata', {
  id: int('id').primaryKey().autoincrement().notNull(),
  userId: int('userId').notNull(),
  content: text('content').notNull(),
  timestamp: int('timestamp').notNull(),
  likes: bigint('likes', { mode: 'number' }).default(0).notNull(),
  deletedAt: int('deleted_at').default(0).notNull(),
  votes: text('votes').default('{}').notNull()
})

export const berryDashChats = mysqlTable('chats', {
  id: int('id').primaryKey().autoincrement().notNull(),
  userId: int('userId').notNull(),
  content: longtext('content').notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  deletedAt: bigint('deleted_at', { mode: 'number' }).default(0).notNull()
})

export const berryDashChatroomReports = mysqlTable('chatroom_reports', {
  id: int('id').primaryKey().autoincrement().notNull(),
  chatId: int('chatId')
    .references(() => berryDashChats.id)
    .notNull(),
  userId: int('userId').notNull(),
  reason: longtext('reason').notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull()
})

export const berryDashMarketplaceIcons = mysqlTable('marketplaceicons', {
  id: int('id').primaryKey().autoincrement().notNull(),
  userId: int('userId').notNull(),
  data: longtext('data').notNull(),
  hash: varchar('hash', { length: 128 }).notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  state: tinyint('state').default(0).notNull(),
  price: int('price').default(0).notNull(),
  name: text('name').notNull()
})
