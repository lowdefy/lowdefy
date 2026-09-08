/*
  Copyright 2020-2026 Lowdefy, Inc

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
import dotenv from 'dotenv';

function readDotEnv(context) {
  // dotenv.config() never overwrites env vars that are already set, so on
  // the first load the real shell environment wins over .env (standard
  // dotenv behavior). On reloads triggered by the .env watcher the previous
  // load has already populated process.env, so without override the changed
  // values would never take effect and the server would restart with stale
  // env.
  let loadedOnce = false;
  return () => {
    dotenv.config({
      path: path.join(context.directories.config, '.env'),
      silent: true,
      override: loadedOnce,
    });
    loadedOnce = true;
  };
}

export default readDotEnv;
