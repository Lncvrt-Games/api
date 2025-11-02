import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors"
import { jsonResponse } from "./lib/util";
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv'

import { handler as launcherVersionsHandler } from "./routes/launcher/versions";
import { handler as launcherLatestHandler } from "./routes/launcher/latest";
import { handler as launcherLoaderLatestHandler } from "./routes/launcher/loader/latest";
import { handler as launcherLoaderUpdateDataHandler } from "./routes/launcher/loader/update-data";

dotenv.config()

const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER ?? '',
    password: process.env.DB_PASS ?? '',
    database: process.env.DB_NAME ?? ''
});

const db = drizzle(connection);

const app = new Elysia()
    .use(cors({
        origin: "*",
        methods: ["POST", "GET"]
    }))

app.get("/launcher/versions", () => launcherVersionsHandler(db))
app.get("/launcher/latest", launcherLatestHandler)
app.get("/launcher/loader/latest", launcherLoaderLatestHandler)
app.get("/launcher/loader/update-data", () => launcherLoaderUpdateDataHandler(db))
app.all("*", () => jsonResponse({ message: "No endpoint found (are you using the correct request method?)" }, 404))

app.listen(3342)