#!/usr/bin/env node

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Register CSS no-op loader before any block imports.
register('./css-noop-loader.mjs', import.meta.url);

// Import the package's compiled blocks.js from dist/
const distDir = resolve(process.cwd(), 'dist');
const blocksModule = await import(pathToFileURL(resolve(distDir, 'blocks.js')).href);

// Collect all named exports (each is a block component)
const blockEntries = Object.entries(blocksModule).filter(([key]) => key !== 'default');

const types = {
  blocks: blockEntries.map(([name]) => name),
  icons: {},
};

for (const [name, block] of blockEntries) {
  types.icons[name] = block.meta?.icons ?? [];
}

writeFileSync(resolve(distDir, 'types.json'), JSON.stringify(types, null, 2) + '\n');
