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

import getSchema from '../../../lib/docs/getSchema.js';

function docsSchemaHandler(c) {
  const kind = c.req.param('kind');
  const type = c.req.param('type');
  let schema;
  try {
    schema = getSchema({ kind, type });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
  if (schema === null) {
    return c.json(
      {
        error: `No schema found for ${kind} type "${type}". See GET /lowdefy-docs/${kind} for available types.`,
      },
      404
    );
  }
  return c.json(schema);
}

export default docsSchemaHandler;
