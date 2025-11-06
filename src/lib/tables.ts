import { bigint, boolean, int, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

export const launcherGames = mysqlTable('launchergames', {
    id: int('id').primaryKey().autoincrement(),
    name: text('name').notNull(),
    official: boolean('official').notNull().default(false),
    verified: boolean('verified').notNull().default(false),
    developer: varchar('developer', { length: 32 }),
    cutOff: int('cutOff').notNull().default(-1)
})

export const launcherVersions = mysqlTable('launcherversions', {
    id: varchar('id', { length: 24 }).primaryKey(),
    versionName: text('versionName').notNull(),
    releaseDate: bigint('releaseDate', { mode: 'number' }).notNull(),
    downloadUrls: text('downloadUrls').notNull(),
    platforms: text('platforms').notNull(),
    executables: text('executables').notNull(),
    hidden: boolean('hidden').notNull().default(false),
    game: int('game').notNull().default(0).references(() => launcherGames.id),
    place: int('place').notNull().default(0),
    sha512sums: text('sha512sums').notNull().default("[]"),
    sizes: text('sizes').notNull().default("[]")
})

export const launcherUpdates = mysqlTable('launcherupdates', {
    id: varchar('id', { length: 24 }).primaryKey(),
    releaseDate: bigint('releaseDate', { mode: 'number' }).notNull(),
    downloadUrls: text('downloadUrls').notNull(),
    platforms: text('platforms').notNull(),
    executables: text('executables').notNull(),
    hidden: boolean('hidden').notNull().default(false),
    place: int('place').notNull().default(0),
    sha512sums: text('sha512sums').notNull().default("[]")
})
