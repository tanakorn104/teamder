import mysql from 'mysql2/promise';

export const db = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT), // ต้องแปลงเป็นตัวเลข
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
  return connection;
};