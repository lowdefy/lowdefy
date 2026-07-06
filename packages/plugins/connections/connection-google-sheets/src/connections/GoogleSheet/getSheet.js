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

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// google-spreadsheet v4+ takes the auth object in the constructor instead of the
// v3 doc.useApiKey / doc.useServiceAccountAuth methods. An API key gives read-only
// access; a service account (JWT) is needed for writes.
function getAuth({ apiKey, client_email, private_key }) {
  if (apiKey) {
    return { apiKey };
  }
  return new JWT({
    email: client_email,
    key: private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheetFromDoc({ doc, sheetId, sheetIndex }) {
  let sheet;
  if (sheetId) {
    sheet = doc.sheetsById[sheetId];
    if (!sheet) {
      throw new Error(`Could not find sheet with sheetId "${sheetId}"`);
    }
  } else {
    sheet = doc.sheetsByIndex[sheetIndex];
    if (!sheet) {
      throw new Error(`Could not find sheet with sheetIndex ${sheetIndex}`);
    }
  }
  return sheet;
}

async function getSheet({ connection }) {
  const { apiKey, client_email, private_key, sheetId, sheetIndex, spreadsheetId } = connection;
  const auth = getAuth({ apiKey, client_email, private_key });
  const doc = new GoogleSpreadsheet(spreadsheetId, auth);

  await doc.loadInfo();

  return getSheetFromDoc({ doc, sheetId, sheetIndex });
}

export default getSheet;
