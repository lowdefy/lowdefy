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
/* eslint-disable no-console */

import path from 'path';
import setupWatcher from '../utils/setupWatcher.mjs';

function envWatcher(context) {
  const callback = async () => {
    console.warn('.env file changed.');
    await context.readDotEnv();
    context.restartServer();
  };
  return setupWatcher({
    callback,
    watchPaths: [path.join(context.directories.config, '.env')],
    watchDotfiles: true,
  });
}

export default envWatcher;
