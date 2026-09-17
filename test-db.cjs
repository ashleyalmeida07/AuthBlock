require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function run() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'admin'`;
    console.log(res);
    const users = await sql`SELECT * FROM admin`;
    console.log(users);
  } catch (e) {
    console.error(e)
  }
}
run();
