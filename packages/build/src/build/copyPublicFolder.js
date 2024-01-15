/*
  Copyright 2020-2024 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import path from 'path';
import fs from 'fs';
import { cleanDirectory, copyFileOrDirectory } from '@lowdefy/node-utils';

async function copyPublicFolder({ context }) {
  if (context.directories.config === context.directories.server) return;

  await cleanDirectory(path.resolve(context.directories.server, 'public'));

  await copyFileOrDirectory(
    path.resolve(context.directories.server, 'public_default'),
    path.resolve(context.directories.server, 'public')
  );

  if (fs.existsSync(path.resolve(context.directories.config, 'public'))) {
    await copyFileOrDirectory(
      path.resolve(context.directories.config, 'public'),
      path.resolve(context.directories.server, 'public')
    );
  }
}

export default copyPublicFolder;
