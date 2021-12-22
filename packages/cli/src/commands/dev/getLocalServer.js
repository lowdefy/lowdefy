import fs from 'fs';
import path from 'path';
import { cleanDirectory, readFile } from '@lowdefy/node-utils';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';

async function getLocalServer({ context }) {
  let fetchServer = false;

  const serverExists = fs.existsSync(path.join(context.directories.server, 'package.json'));
  if (!serverExists) fetchServer = true;

  if (serverExists) {
    const serverPackageConfig = JSON.parse(
      await readFile(path.join(context.directories.server, 'package.json'))
    );
    if (serverPackageConfig.version !== context.lowdefyVersion) {
      fetchServer = true;
      context.print.warn(`Removing @lowdefy/server with version ${serverPackageConfig.version}`);
      await cleanDirectory(context.directories.server);
    }
  }

  if (fetchServer) {
    const localServerExists = fs.existsSync(
      new URL('../../lowdefy-server-4.0.0-alpha.5.tgz', import.meta.url).pathname
    );
    if (localServerExists) {
      context.print.spin('Getting @lowdefy/server from local build.');
      await decompress(
        new URL('../../lowdefy-server-4.0.0-alpha.5.tgz', import.meta.url).pathname,
        context.directories.server,
        {
          plugins: [decompressTargz()],
          strip: 1, // Removes leading /package dir from the file path
        }
      );
      context.print.log('Used @lowdefy/server from local build.');
      return;
    }
  }
}

export default getLocalServer;
