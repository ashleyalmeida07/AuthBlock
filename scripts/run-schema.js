import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.")
    return
  }

  const sql = neon(process.env.DATABASE_URL)

  try {
    console.log("Reading schema.sql...")
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')
    
    // Split the SQL statements by semicolon and filter empty ones
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      
    console.log(`Executing ${statements.length} statements...`)
    
    for (const [index, stmt] of statements.entries()) {
      try {
        await sql.query(stmt)
      } catch (err) {
        // ENUM type exists error is fine, we can ignore it
        if (err.message?.includes('already exists')) {
          console.log(`Ignoring exists error on stmt ${index + 1}`)
        } else {
          console.error(`Error on statement ${index + 1}:\n${stmt}\n`, err)
          throw err
        }
      }
    }
    
    console.log("✅ Database schema migrated successfully!")
    console.log("✅ Admin user (ashleyalmeida182006@gmail.com) has been seeded.")
  } catch (err) {
    console.error("❌ Migration failed:", err)
  }
}

main()
