import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { users, reports } from '@shared/schema';

const { Pool } = pg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a drizzle instance
export const db = drizzle(pool);

// Initialize the database
export async function initDatabase() {
  console.log('Initializing database...');
  
  try {
    // Create schema if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drizzle (
        id serial PRIMARY KEY,
        hash text NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // Create tables using raw SQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        first_name text NOT NULL,
        last_name text NOT NULL,
        username text NOT NULL UNIQUE,
        email text NOT NULL UNIQUE,
        password text NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS reports (
        id serial PRIMARY KEY,
        user_id integer NOT NULL REFERENCES users(id),
        title text NOT NULL,
        description text NOT NULL,
        address text NOT NULL,
        latitude double precision NOT NULL,
        longitude double precision NOT NULL,
        status text NOT NULL DEFAULT 'pendente',
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}