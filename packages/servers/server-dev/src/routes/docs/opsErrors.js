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

import getProdErrors from '../../../lib/docs/ops/getProdErrors.js';

// REST twin of the lowdefy_prod_errors MCP tool. The origin is the host the
// caller actually reached this server on — the loopback check in
// isOpsQueryAllowed reads it, so a tunnel or a LAN bind is refused here too.
async function docsOpsErrorsHandler(c) {
  const { since, group_by: groupBy, limit } = c.req.query();
  return c.json(
    await getProdErrors({
      origin: new URL(c.req.url).origin,
      since,
      group_by: groupBy,
      limit: limit === undefined ? undefined : Number(limit),
    })
  );
}

export default docsOpsErrorsHandler;
