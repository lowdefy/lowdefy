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

import listTypes from '../../../lib/docs/listTypes.js';
import normalizeTypeKind from '../../../lib/docs/normalizeTypeKind.js';

function docsTypesHandler(c) {
  const kind = c.req.param('kind');
  if (normalizeTypeKind({ kind }) === null) {
    return c.json(
      {
        error: `Unknown docs kind "${kind}". Use one of: blocks, operators, actions, connections, requests, agents, notifications, websockets. See GET /docs for all routes.`,
      },
      404
    );
  }
  return c.json(listTypes({ kind }));
}

export default docsTypesHandler;
