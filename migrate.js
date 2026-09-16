import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function runMigrations() {
	const connectionString = process.env.DATABASE_URL
	if (!connectionString) {
		console.error('DATABASE_URL is missing.')
		process.exit(1)
	}

	// Use a single connection for migrations
	const sql = postgres(connectionString, { max: 1 })
	const db = drizzle(sql)

	console.log('Running Drizzle migrations...')
	await migrate(db, { migrationsFolder: './drizzle/migrations' })
	console.log('Migrations complete!')

	await sql.end()
}

runMigrations().catch((err) => {
	console.error('Migration failed:', err)
	process.exit(1)
})
