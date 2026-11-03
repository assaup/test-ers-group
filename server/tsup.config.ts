import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node24',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // `sqlite` exists only as `node:sqlite` — stripping the prefix breaks the import
  removeNodeProtocol: false,
  // shared ships TypeScript sources, Node can't load them from node_modules — bundle them in
  noExternal: ['@test-ers/shared'],
  // The bundle is what `npm start` runs, so it is the production build by definition
  env: { NODE_ENV: 'production' },
});
