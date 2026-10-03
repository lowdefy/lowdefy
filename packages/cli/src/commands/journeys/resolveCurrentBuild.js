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

import axios from 'axios';
import { type } from '@lowdefy/helpers';
import { readDevInstance } from '@lowdefy/node-utils';

const BUILD_STATUS_TIMEOUT_MS = 2000;

// Build ids are ISO timestamps (the dev server's getBuildId), so the newest
// sorts last.
function newestRecordedBuild({ records }) {
  const builds = (records ?? [])
    .map((record) => record.build)
    .filter((build) => type.isString(build) && build !== '')
    .sort();
  return builds.length === 0 ? null : builds[builds.length - 1];
}

async function readServedBuild({ context }) {
  const instance = readDevInstance({ configDirectory: context.directories.config });
  if (type.isNone(instance) || !type.isString(instance.url)) return undefined;
  try {
    const response = await axios.get(`${instance.url}/lowdefy-docs/build-status`, {
      timeout: BUILD_STATUS_TIMEOUT_MS,
    });
    const buildId = response.data?.buildId;
    return type.isString(buildId) ? buildId : undefined;
  } catch {
    // An instance record whose server does not answer (stopping, restarting,
    // or crashed before cleanup) serves no build; the records decide instead.
    return undefined;
  }
}

// `--build current`: the build the running dev server for this app serves now.
// It changes on every successful build and page invalidation, so it reads as
// "since my last config edit". With no dev server answering, the newest build
// among the selected records stands in, and `from` says so for the caller to
// report. With neither, buildId is null.
async function resolveCurrentBuild({ context, records }) {
  const served = await readServedBuild({ context });
  if (!type.isUndefined(served)) {
    return { buildId: served, from: 'server' };
  }
  return { buildId: newestRecordedBuild({ records }), from: 'records' };
}

export default resolveCurrentBuild;
