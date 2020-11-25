/*
  Copyright 2020 Lowdefy, Inc

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

import schema from './GoogleSheetAppendOneSchema.json';
import getSheet from '../getSheet';
import cleanRows from '../cleanRows';
import { transformWrite } from '../transformTypes';

async function googleSheetAppendOne({ request, connection }) {
  const { row, options = {} } = request;
  const { raw } = options;
  const sheet = await getSheet({ connection });
  const insertedRow = await sheet.addRow(
    transformWrite({ input: row, types: connection.columnTypes }),
    { raw }
  );
  return {
    insertedCount: 1,
    row: cleanRows(insertedRow),
  };
}

export default { resolver: googleSheetAppendOne, schema, checkRead: false, checkWrite: true };
