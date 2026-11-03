import { createApp } from './app';
import { config } from './config';
import { openDatabase } from './db/connection';
import { runMigrations } from './db/migrate';
import { seedDatabase } from './db/seed';

const db = openDatabase(config.dbPath);

const applied = runMigrations(db);
if (applied.length > 0) {
  console.info(`Applied migrations: ${applied.join(', ')}`);
}

const { employeesAdded } = seedDatabase(db);
if (employeesAdded > 0) {
  console.info(`Seeded ${employeesAdded} demo employees`);
}

const server = createApp({ db }).listen(config.port, () => {
  console.info(`Server listening on http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
