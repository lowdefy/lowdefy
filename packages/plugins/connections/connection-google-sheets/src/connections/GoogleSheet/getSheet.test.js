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

import { jest } from '@jest/globals';
import { wait } from '@lowdefy/helpers';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// google-spreadsheet v4+ takes auth in the constructor, so we record the
// constructor args instead of the removed useApiKey / useServiceAccountAuth calls.
const mockGoogleSpreadsheet = jest.fn();
const mockJWT = jest.fn();
const mockLoadInfo = jest.fn();

let mockSheetsById = {};
let mockSheetsByIndex = {};

jest.unstable_mockModule('google-spreadsheet', () => ({
  GoogleSpreadsheet: function GoogleSpreadsheet(spreadsheetId, auth) {
    mockGoogleSpreadsheet(spreadsheetId, auth);
    this.loadInfo = mockLoadInfo;
    this.sheetsById = mockSheetsById;
    this.sheetsByIndex = mockSheetsByIndex;
  },
}));

jest.unstable_mockModule('google-auth-library', () => ({
  JWT: function JWT(config) {
    mockJWT(config);
    // Tag so we can assert the doc was constructed with the JWT instance.
    this.__jwt = true;
    this.config = config;
  },
}));

const { default: getSheet } = await import('./getSheet.js');

const loadInfoDefaultImp = async () => {
  await wait(3);
  mockSheetsById.sheetId1 = { id: 'sheetId1' };
  mockSheetsByIndex[0] = { index: 0 };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSheetsById = {};
  mockSheetsByIndex = {};
  mockLoadInfo.mockImplementation(loadInfoDefaultImp);
});

test('getSheet with apiKey, sheetId', async () => {
  const sheet = await getSheet({
    connection: {
      apiKey: 'valid',
      spreadsheetId: 'spreadsheetId',
      sheetId: 'sheetId1',
    },
  });
  expect(mockJWT.mock.calls).toEqual([]);
  expect(mockGoogleSpreadsheet.mock.calls).toEqual([['spreadsheetId', { apiKey: 'valid' }]]);
  expect(mockLoadInfo.mock.calls).toEqual([[]]);
  expect(sheet).toEqual({ id: 'sheetId1' });
});

test('getSheet with service account, sheetId', async () => {
  const sheet = await getSheet({
    connection: {
      client_email: 'client_email',
      private_key: 'private_key',
      spreadsheetId: 'spreadsheetId',
      sheetId: 'sheetId1',
    },
  });
  expect(mockJWT.mock.calls).toEqual([
    [{ email: 'client_email', key: 'private_key', scopes: SCOPES }],
  ]);
  // The doc is constructed with the JWT instance created above.
  expect(mockGoogleSpreadsheet.mock.calls[0][0]).toEqual('spreadsheetId');
  expect(mockGoogleSpreadsheet.mock.calls[0][1].__jwt).toBe(true);
  expect(mockLoadInfo.mock.calls).toEqual([[]]);
  expect(sheet).toEqual({ id: 'sheetId1' });
});

test('getSheet with service account, sheetIndex', async () => {
  const sheet = await getSheet({
    connection: {
      client_email: 'client_email',
      private_key: 'private_key',
      spreadsheetId: 'spreadsheetId',
      sheetIndex: 0,
    },
  });
  expect(mockJWT.mock.calls).toEqual([
    [{ email: 'client_email', key: 'private_key', scopes: SCOPES }],
  ]);
  expect(sheet).toEqual({ index: 0 });
});

test('getSheet propagates a loadInfo (auth/network) error', async () => {
  mockLoadInfo.mockImplementation(async () => {
    await wait(3);
    throw new Error('Google API error.');
  });
  await expect(
    getSheet({
      connection: {
        client_email: 'client_email',
        private_key: 'private_key',
        spreadsheetId: 'spreadsheetId',
        sheetId: 'sheetId1',
      },
    })
  ).rejects.toThrow('Google API error.');
});

test('getSheet with sheetId, sheet does not exist', async () => {
  await expect(
    getSheet({
      connection: {
        apiKey: 'valid',
        spreadsheetId: 'spreadsheetId',
        sheetId: 'sheetId2',
      },
    })
  ).rejects.toThrow('Could not find sheet with sheetId "sheetId2"');
});

test('getSheet with sheetIndex, sheet does not exist', async () => {
  await expect(
    getSheet({
      connection: {
        apiKey: 'valid',
        spreadsheetId: 'spreadsheetId',
        sheetIndex: 1,
      },
    })
  ).rejects.toThrow('Could not find sheet with sheetIndex 1');
});
