import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node24',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Модуль `sqlite` существует только как `node:sqlite` — без префикса импорт ломается
  removeNodeProtocol: false,
  // shared поставляется исходниками на TypeScript, Node не загрузит их из node_modules — вшиваем в бандл
  noExternal: ['@test-ers/shared'],
  // Бандл — это то, что запускает `npm start`, поэтому он по определению production-сборка
  env: { NODE_ENV: 'production' },
});
