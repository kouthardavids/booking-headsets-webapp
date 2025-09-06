import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testDB() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT,
    });
    console.log('DB Connected!');
    await conn.end();
  } catch (err) {
    console.error('DB Connection Failed:', err);
  }
}

testDB();
