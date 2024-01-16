#!/usr/bin/env node
/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import path from 'path';
import pino from 'pino';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import build from '@lowdefy/build';
import createCustomPluginTypesMap from './createCustomPluginTypesMap.mjs';

const argv = yargs(hideBin(process.argv)).argv;

async function run() {
  const serverDirectory = path.resolve(
    argv.serverDirectory || process.env.LOWDEFY_DIRECTORY_SERVER || process.cwd()
  );
  const directories = {
    build: path.join(serverDirectory, 'build'),
    config: path.resolve(
      argv.configDirectory || process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd()
    ),
    server: serverDirectory,
  };

  const customTypesMap = await createCustomPluginTypesMap({ directories });

  const logger = pino({
    name: 'lowdefy_build',
    level: process.env.LOWDEFY_LOG_LEVEL ?? 'info',
    base: { pid: undefined, hostname: undefined },
    mixin: (context, level) => {
      return {
        ...context,
        print: context.print ?? logger.levels.labels[level],
      };
    },
  });

  await build({
    customTypesMap,
    directories,
    entitlements: JSON.parse(process.env.LOWDEFY_LICENSE_ENTITLEMENTS ?? '[]'),
    logger,
    refResolver: argv.refResolver || process.env.LOWDEFY_BUILD_REF_RESOLVER,
  });
}

run();
