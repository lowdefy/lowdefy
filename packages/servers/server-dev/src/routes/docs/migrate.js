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
import runMigrate from '../../../lib/docs/runMigrate.js';

// POST /lowdefy-docs/migrate { dryRun?, to?, allowChecksumMismatch? } — the
// REST twin of the lowdefy_migrate MCP tool, so non-MCP clients and
// `lowdefy test` can apply migrations through the dev server.
async function docsMigrateHandler(c) {
  let body = {};
  try {
    body = await c.req.json();
  } catch {
    // An empty body is a plain run with defaults.
  }
  const result = await runMigrate({
    dryRun: body.dryRun === true,
    to: body.to,
    allowChecksumMismatch: body.allowChecksumMismatch === true,
  });
  return c.json(result);
}

export default docsMigrateHandler;
