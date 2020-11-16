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

import { GoogleSpreadsheet } from 'google-spreadsheet';

function replacer(key, value) {
  if (key === '_sheet') return undefined;
  return value;
}

async function getRows({ request, connection, context }) {
  try {
    const { spreadsheetId, apiKey, client_email, private_key, sheetId, sheetIndex } = connection;
    const doc = new GoogleSpreadsheet(spreadsheetId);
    // console.log(doc);
    if (apiKey) {
      doc.useApiKey('YOUR-API-KEY');
    } else {
      await doc.useServiceAccountAuth({
        client_email: client_email,
        private_key: private_key,
      });
    }
    await doc.loadInfo();
    let sheet;
    if (sheetId) {
      sheet = doc.sheetsById[sheetId];
    } else {
      sheet = doc.sheetsByIndex[sheetIndex];
    }
    const rows = await sheet.getRows(request);
    console.log('rows', JSON.stringify(rows, replacer));
    return JSON.parse(JSON.stringify(rows, replacer));
  } catch (error) {
    if (error instanceof context.ConfigurationError) {
      throw error;
    }
    throw new context.RequestError(error.message);
  }
}

export default getRows;
