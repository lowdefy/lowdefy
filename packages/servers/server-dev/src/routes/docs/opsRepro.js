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

import getProdRepro from '../../../lib/docs/ops/getProdRepro.js';

// REST twin of the lowdefy_prod_repro MCP tool.
async function docsOpsReproHandler(c) {
  return c.json(await getProdRepro({ origin: new URL(c.req.url).origin, rid: c.req.param('rid') }));
}

export default docsOpsReproHandler;
