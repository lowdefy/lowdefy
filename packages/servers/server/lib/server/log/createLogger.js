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

import { createNodeLogger } from '@lowdefy/logger/node';
import { type } from '@lowdefy/helpers';

import appMeta from '../../build/appMeta.js';

// Deploy identity on every log line — pid/hostname are stripped, so these
// fields are what correlates a line to an app build across replicas.
const base = { pid: undefined, hostname: undefined };
if (!type.isNone(appMeta.name)) {
  base.app_name = appMeta.name;
}
if (!type.isNone(appMeta.version)) {
  base.app_version = appMeta.version;
}
if (!type.isNone(appMeta.gitSha)) {
  base.git_sha = appMeta.gitSha;
}

const logger = createNodeLogger({
  name: 'lowdefy_server',
  level: process.env.LOWDEFY_LOG_LEVEL ?? 'info',
  base,
});

function createLogger(metadata = {}) {
  return logger.child(metadata);
}

export default createLogger;
