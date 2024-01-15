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

import cleanRows from '../cleanRows.js';
import getSheet from '../getSheet.js';
import { transformRead } from '../transformTypes.js';
import mingoFilter from '../mingoFilter.js';
import schema from './schema.js';

async function GoogleSheetGetOne({ request, connection }) {
  const { filter, options = {} } = request;
  const { limit, skip } = options;
  const sheet = await getSheet({ connection });
  let rows = await sheet.getRows({ limit, offset: skip });
  rows = cleanRows(rows);
  rows = transformRead({ input: rows, types: connection.columnTypes });
  if (filter) {
    rows = mingoFilter({ input: rows, filter });
  }
  return rows[0] ?? null;
}

GoogleSheetGetOne.schema = schema;
GoogleSheetGetOne.meta = {
  checkRead: true,
  checkWrite: false,
};

export default GoogleSheetGetOne;
