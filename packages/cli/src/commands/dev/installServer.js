/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { spawnProcess } from '@lowdefy/node-utils';

const args = {
  npm: ['install', '--legacy-peer-deps'],
  yarn: ['install'],
};

async function installServer({ context }) {
  context.print.spin(`Running ${context.packageManager} install.`);
  try {
    await spawnProcess({
      logger: context.print,
      command: context.packageManager, // npm or yarn
      args: args[context.packageManager],
      processOptions: {
        cwd: context.directories.dev,
      },
      silent: false,
    });
  } catch (error) {
    console.log(error);
    throw new Error(`${context.packageManager} install failed.`);
  }
  context.print.log(`${context.packageManager} install successful.`);
}

export default installServer;
