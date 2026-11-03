import { existsSync } from 'node:fs';
import { join } from 'node:path';
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

const clientBuilt = existsSync(join(config.clientDir, 'index.html'));
const clientDir = config.isProduction && clientBuilt ? config.clientDir : undefined;

const server = createApp({ db, clientDir }).listen(config.port, () => {
  console.info(`Server listening on http://localhost:${config.port}`);
  if (!config.isProduction) {
    console.info('Development mode: the client is served by Vite (http://localhost:5173)');
  } else if (clientDir) {
    console.info(`Serving the built client at http://localhost:${config.port}`);
  } else {
    console.info('Client is not built: API only (run `npm run build` first)');
  }
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
