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

import getSheet from '../getSheet.js';
import { transformRead, transformWrite } from '../transformTypes.js';
import mingoFilter from '../mingoFilter.js';
import schema from './schema.js';

async function GoogleSheetUpdateMany({ request, connection }) {
  const { filter, update, options = {} } = request;
  const { limit, skip, raw } = options;
  const sheet = await getSheet({ connection });
  let rows = await sheet.getRows({ limit, offset: skip });
  rows = transformRead({ input: rows, types: connection.columnTypes });
  rows = mingoFilter({ input: rows, filter });
  const transformedUpdate = transformWrite({ input: update, types: connection.columnTypes });
  if (rows.length === 0) {
    return {
      modifiedCount: 0,
    };
  }
  const promises = rows.map(async (row) => {
    Object.assign(row, transformedUpdate);
    await row.save({ raw });
  });
  await Promise.all(promises);
  return {
    modifiedCount: rows.length,
  };
}

GoogleSheetUpdateMany.schema = schema;
GoogleSheetUpdateMany.meta = {
  checkRead: false,
  checkWrite: true,
};

export default GoogleSheetUpdateMany;
