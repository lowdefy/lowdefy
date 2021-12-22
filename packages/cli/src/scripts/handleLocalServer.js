#!/usr/bin/env node

// TODO: Used for local builds, remove once finished;
import spawnProcess from '../utils/spawnProcess.js';
import createPrint from '../utils/print.js';
import path from 'path';
import fs from 'fs';

async function packLocalServer() {
  const context = { print: createPrint() };

  try {
    await spawnProcess({
      context,
      command: 'npm',
      args: ['pack'],
      processOptions: {
        cwd: path.resolve(process.cwd(), '../server'),
      },
      silent: false,
    });
  } catch (error) {
    throw new Error(`${context.packageManager} pack failed.`);
  }
  context.print.log(`${context.packageManager} pack successful.`);
}

async function copyLocalServer() { //TODO: Resolve paths and versions
  const originalFilePath = path.resolve(
    process.cwd(),
    '../server/lowdefy-server-4.0.0-alpha.5.tgz'
  );
  const finalFilePath = path.resolve(process.cwd(), './dist/lowdefy-server-4.0.0-alpha.5.tgz');
  await fs.copyFile(originalFilePath, finalFilePath, (error) => {
    if (error) {
      throw new Error('Server copy failed.');
    }
  });
}

await packLocalServer();
await copyLocalServer();
