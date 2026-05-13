import path from "node:path"
import { loadEnvFile } from "node:process"
import { defineConfig } from "prisma/config"

try { loadEnvFile(path.join(import.meta.dirname, ".env.local")) } catch {}

export default defineConfig({
  schema: path.join(import.meta.dirname, "prisma/schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
