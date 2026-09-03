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
import loggerConfig from '../../build/logger.js';

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

// One line per process start. On a long-lived host that is one line per
// deploy; on serverless it is one per cold start, per replica - queries group
// by git_sha, never by line count. app_version and git_sha are on every line
// already, so what this line adds is the runtime the build is running on.
logger.info({
  event: 'process_started',
  app_version: appMeta.version,
  git_sha: appMeta.gitSha,
  lowdefy_version: appMeta.lowdefyVersion,
  node: process.version,
});

// The wide-event policy travels on the logger because the logger is the one
// build-configured object every request context carries - logEvent
// (@lowdefy/api) reads it to choose a level and the sampling decision.
function createLogger(metadata = {}) {
  const child = logger.child(metadata);
  child.eventsConfig = loggerConfig.events;
  return child;
}

export default createLogger;
