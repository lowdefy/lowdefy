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
import { transformRead, transformWrite } from '../transformTypes.js';
import mingoFilter from '../mingoFilter.js';
import schema from './schema.js';

async function GoogleSheetUpdateOne({ request, connection }) {
  const { filter, update, options = {} } = request;
  const { limit, skip, upsert, raw } = options;
  const sheet = await getSheet({ connection });
  let rows = await sheet.getRows({ limit, offset: skip });
  rows = transformRead({ input: rows, types: connection.columnTypes });
  rows = mingoFilter({ input: rows, filter });
  const transformedUpdate = transformWrite({ input: update, types: connection.columnTypes });
  if (rows.length === 0) {
    if (upsert) {
      const insertedRow = await sheet.addRow(transformedUpdate, { raw });
      return {
        modifiedCount: 1,
        upserted: true,
        row: cleanRows(insertedRow),
      };
    }
    return {
      modifiedCount: 0,
      upserted: false,
    };
  }
  const row = rows[0];
  Object.assign(row, transformedUpdate);
  await row.save({ raw });
  return {
    modifiedCount: 1,
    upserted: false,
    row: cleanRows(row),
  };
}

GoogleSheetUpdateOne.schema = schema;
GoogleSheetUpdateOne.meta = {
  checkRead: false,
  checkWrite: true,
};

export default GoogleSheetUpdateOne;
