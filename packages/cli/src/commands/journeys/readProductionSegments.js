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

import { compileSegments } from '@lowdefy/node-utils';

import loadBlockMetas from './loadBlockMetas.js';
import loadRouteTable from './loadRouteTable.js';
import readProductionTrace from './readProductionTrace.js';
import resolveBuildDirectory from './resolveBuildDirectory.js';

// The production window's segments (compileSegments), for coverage, with the
// app's isConfigText to read journeys by the same text rule and the window's
// row count, which decides whether coverage groups flows. Coverage passes
// maxDays, the mining cap. Evidence refresh reads whole months
// through readProductionMonths instead.
async function readProductionSegments({ context, maxDays }) {
  const { options } = context;
  const { records, window, isConfigText } = await readProductionTrace({
    context,
    maxDays,
    since: options.since,
    from: options.from,
    to: options.to,
  });
  const buildDirectory = resolveBuildDirectory({ context });
  const { segments } = compileSegments({
    records,
    blockMetas: loadBlockMetas({ buildDirectory }),
    routeTable: loadRouteTable({ buildDirectory }),
    source: 'production',
    filters: {
      since: Date.parse(`${window.from}T00:00:00.000Z`),
      until: Date.parse(`${window.to}T23:59:59.999Z`),
    },
  });
  return { segments, window, isConfigText, rows: records.length };
}

export default readProductionSegments;
