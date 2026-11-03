// Starts the built server against a throwaway database and checks that it boots and answers.
// Catches bundling problems that unit tests (which run the TypeScript sources) can't see.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = '3999';
const dir = mkdtempSync(join(tmpdir(), 'test-ers-smoke-'));
const entry = fileURLToPath(new URL('../dist/index.js', import.meta.url));
const server = spawn(process.execPath, [entry], {
  env: { ...process.env, PORT, DB_PATH: join(dir, 'app.db') },
  stdio: 'inherit',
});

const exitCode = await waitForHealth(`http://localhost:${PORT}/api/health`).finally(cleanUp);
process.exit(exitCode);

async function cleanUp() {
  // Wait for the process to exit: on Windows the open database file blocks deleting the dir
  if (server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
  rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
}

async function waitForHealth(url) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null) {
      console.error('Smoke test failed: server exited during startup');
      return 1;
    }
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.info('Smoke test passed');
        return 0;
      }
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.error('Smoke test failed: no healthy response within 5s');
  return 1;
}
