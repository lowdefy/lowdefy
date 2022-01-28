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

import configWatcher from '../watchers/configWatcher.mjs';
import envWatcher from '../watchers/envWatcher.mjs';

/*
Config change
Watch <config-dir>, <watch-dirs>, !<ignore-dirs>
- Lowdefy build
- Trigger soft reload
----------------------------------------
Install new plugin
Watch <server>/package.json

- Install Server.
- Next build.
- No need for Lowdefy build (confirm?)
- Trigger hard reload
- Restart server.
----------------------------------------
.env change
Watch <config-dir>/.env
- Trigger hard reload
- Restart server.
----------------------------------------
Lowdefy version changed
Watch <config-dir>/lowdefy.yaml
- Warn and process.exit()
----------------------------------------
Style vars/app config change
Watch <server-dir>/build/app.json
Watch <server-dir>/build/config.json
- Next build.
- Trigger hard reload
- Restart server.
----------------------------------------
New plugin or icon used.
Watch <server-dir>/build/plugins/*
- Next build. (or dynamic import?)
- Trigger hard reload
- Restart server.
*/

function startWatchers(context) {
  return async () => {
    await Promise.all([configWatcher(context), envWatcher(context)]);
  };
}

export default startWatchers;
