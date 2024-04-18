/*
  Copyright 2020-2024 Lowdefy, Inc

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

import knex from 'knex';
import schema from './schema.js';

async function KnexRaw({ request, connection }) {
  const client = knex(connection);
  const res = await client.raw(request.query, request.parameters);
  Object.keys(res).forEach((key) => {
    if (key.startsWith('_')) {
      delete res[key];
    }
  });
  return res;
}

KnexRaw.schema = schema;
KnexRaw.meta = {
  checkRead: false,
  checkWrite: false,
};

export default KnexRaw;
