import { createApp } from './app';
import { config } from './config';
import { openDatabase } from './db/connection';
import { runMigrations } from './db/migrate';
import { DEMO_USER, seedDatabase } from './db/seed';

const db = openDatabase(config.dbPath);

const applied = runMigrations(db);
if (applied.length > 0) {
  console.info(`Applied migrations: ${applied.join(', ')}`);
}

const { employeesAdded, demoUserAdded } = await seedDatabase(db);
if (employeesAdded > 0) {
  console.info(`Seeded ${employeesAdded} demo employees`);
}
if (demoUserAdded) {
  console.info(`Seeded demo user ${DEMO_USER.email}`);
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
