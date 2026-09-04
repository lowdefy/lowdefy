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

import devNoticeStore from '../devNoticeStore.js';
import createLogger from '../../server/log/createLogger.js';

const logger = createLogger({ server: 'lowdefy-dev-ops' });

// The audit trail R19 requires. Every ops tool call — the ones that ran and
// the ones that were refused — leaves a line in the dev terminal and an entry
// in the dev notice store, so lowdefy_build_status shows the developer what
// production data an agent asked for while they were not watching. The
// params are the closed vocabulary the tool was called with, never a rendered
// query, and never a row of the answer.
function recordOpsQuery({ tool, params, allowed, reason }) {
  logger.info(
    { event: 'ops_query', tool, params, allowed, reason: reason ?? null },
    `Ops query ${tool}${allowed ? '' : ' refused'}`
  );
  devNoticeStore.push({
    timestamp: new Date().toISOString(),
    name: 'ops_query',
    level: allowed ? 'info' : 'warn',
    message: allowed
      ? `Ops query ${tool} read the production log sink.`
      : `Ops query ${tool} was refused: ${reason}`,
    source: null,
    config: null,
    details: { tool, params, allowed },
    // Not a config site, so never deduped: the store keeps every ops query
    // rather than collapsing repeats into a count.
    configKey: null,
  });
}

export default recordOpsQuery;
