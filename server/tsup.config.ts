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
});
