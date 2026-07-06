/* eslint-disable no-param-reassign */

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

import { execSync } from 'child_process';
import { type } from '@lowdefy/helpers';

function computeGitSha() {
  const fromEnv = process.env.LOWDEFY_GIT_SHA?.trim();
  if (fromEnv) return fromEnv;
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (_) {
    return null;
  }
}

// App metadata resolved from the root lowdefy.yaml. Computed before buildRefs
// so it can back the _build.app operator, and reused by the buildApp step.
function computeAppMeta(source = {}) {
  return {
    slug: source.slug ?? null,
    name: source.name ?? null,
    version: source.version ?? null,
    description: source.description ?? null,
    license: source.license ?? null,
    lowdefyVersion: source.lowdefy ?? null,
    gitSha: computeGitSha(),
  };
}

function buildApp({ components, context }) {
  if (type.isNone(components.app)) {
    components.app = {};
  }
  if (!type.isObject(components.app)) {
    throw new Error('lowdefy.app is not an object.');
  }
  if (type.isNone(components.app.html)) {
    components.app.html = {};
  }
  if (type.isNone(components.app.html.appendBody)) {
    components.app.html.appendBody = '';
  }
  if (type.isNone(components.app.html.appendHead)) {
    components.app.html.appendHead = '';
  }
  if (type.isNone(components.app.email)) {
    components.app.email = {};
  }
  components.appMeta = context?.appMeta ?? computeAppMeta(components);
  return components;
}

export { computeAppMeta };
export default buildApp;
