/*
  Copyright 2020-2021 Lowdefy, Inc

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

import schema from './GoogleSheetDeleteOneSchema.json';
import cleanRows from '../cleanRows';
import getSheet from '../getSheet';
import { transformRead } from '../transformTypes';
import mingoFilter from '../mingoFilter';

async function googleSheetDeleteOne({ request, connection }) {
  const { filter, options = {} } = request;
  const { limit, skip } = options;
  const sheet = await getSheet({ connection });
  let rows = await sheet.getRows({ limit, offset: skip });
  rows = transformRead({ input: rows, types: connection.columnTypes });
  rows = mingoFilter({ input: rows, filter });
  if (rows.length === 0) {
    return {
      deletedCount: 0,
    };
  }
  const row = rows[0];
  await row.delete();
  return {
    deletedCount: 1,
    row: cleanRows(row),
  };
}

export default { resolver: googleSheetDeleteOne, schema, checkRead: false, checkWrite: true };
