import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'kanban_db',
  waitForConnections: true,
  connectionLimit:    10,
});

export const testConnection = async (): Promise<void> => {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL conectado correctamente');
    conn.release();
  } catch (error) {
    console.error('Error al conectar MySQL:', error);
    process.exit(1);
  }
};