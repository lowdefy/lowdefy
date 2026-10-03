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

import { compileTrace } from '@lowdefy/node-utils';

import loadBlockMetas from './loadBlockMetas.js';
import readProductionTrace from './readProductionTrace.js';
import resolveBuildDirectory from './resolveBuildDirectory.js';

// The production window's segments, compiled the way `journeys compile
// --source production` compiles them, for evidence and coverage.
function readProductionSegments({ context }) {
  const { options } = context;
  const { records, window } = readProductionTrace({
    directories: context.directories,
    since: options.since,
    from: options.from,
    to: options.to,
  });
  const { segments } = compileTrace({
    records,
    blockMetas: loadBlockMetas({ buildDirectory: resolveBuildDirectory({ context }) }),
    source: 'production',
    filters: {
      since: Date.parse(`${window.from}T00:00:00.000Z`),
      until: Date.parse(`${window.to}T23:59:59.999Z`),
    },
  });
  return { segments, window };
}

export default readProductionSegments;
