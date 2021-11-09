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

// eslint-disable-next-line no-unused-vars
import { GoogleSpreadsheet } from 'google-spreadsheet';
import getSheet from './getSheet';

// Not testing if spreadsheetId is given to GoogleSpreadsheet class in
// const doc = new GoogleSpreadsheet(spreadsheetId);

const mockSheetsById = {};
const mockSheetsByIndex = {};
const mockUseApiKey = jest.fn();
const mockUseServiceAccountAuth = jest.fn();
const mockLoadInfo = jest.fn();

jest.mock('google-spreadsheet', () => {
  function GoogleSpreadsheet() {
    return {
      sheetsById: mockSheetsById,
      sheetsByIndex: mockSheetsByIndex,
      useApiKey: mockUseApiKey,
      useServiceAccountAuth: mockUseServiceAccountAuth,
      loadInfo: mockLoadInfo,
    };
  }
  return {
    GoogleSpreadsheet,
  };
});

async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const useApiKeyDefaultImp = (apiKey) => {
  if (apiKey !== 'valid') {
    throw new Error('Test Api Key Auth Error.');
  }
};

const useServiceAccountAuthDefaultImp = async ({ client_email, private_key }) => {
  await wait(3);
  if (client_email !== 'client_email' || private_key !== 'private_key') {
    throw new Error('Test Service Account Auth Error.');
  }
};

const loadInfoDefaultImp = async () => {
  await wait(3);
  mockSheetsById.sheetId1 = { id: 'sheetId1' };
  mockSheetsByIndex[0] = { index: 0 };
};

beforeEach(() => {
  jest.resetAllMocks();
  Object.keys(mockSheetsById).forEach((key) => {
    delete mockSheetsById[key];
  });
  Object.keys(mockSheetsByIndex).forEach((key) => {
    delete mockSheetsByIndex[key];
  });
});

test('getSheet with apiKey, sheetId', async () => {
  mockUseApiKey.mockImplementation(useApiKeyDefaultImp);
  mockUseServiceAccountAuth.mockImplementation(useServiceAccountAuthDefaultImp);
  mockLoadInfo.mockImplementation(loadInfoDefaultImp);
  const sheet = await getSheet({
    connection: {
      apiKey: 'valid',
      spreadsheetId: 'spreadsheetId',
      sheetId: 'sheetId1',
    },
  });
  expect(mockUseApiKey.mock.calls).toEqual([['valid']]);
  expect(mockUseServiceAccountAuth.mock.calls).toEqual([]);
  expect(mockLoadInfo.mock.calls).toEqual([[]]);
  expect(sheet).toEqual({ id: 'sheetId1' });
});

test('getSheet with service account, sheetId', async () => {
  mockUseApiKey.mockImplementation(useApiKeyDefaultImp);
  mockUseServiceAccountAuth.mockImplementation(useServiceAccountAuthDefaultImp);
  mockLoadInfo.mockImplementation(loadInfoDefaultImp);
  const sheet = await getSheet({
    connection: {
      client_email: 'client_email',
      private_key: 'private_key',
      spreadsheetId: 'spreadsheetId',
      sheetId: 'sheetId1',
    },
  });
  expect(mockUseApiKey.mock.calls).toEqual([]);
  expect(mockUseServiceAccountAuth.mock.calls).toEqual([
    [
      {
        client_email: 'client_email',
        private_key: 'private_key',
      },
    ],
  ]);
  expect(mockLoadInfo.mock.calls).toEqual([[]]);
  expect(sheet).toEqual({ id: 'sheetId1' });
});

test('getSheet with service account, sheetIndex', async () => {
  mockUseApiKey.mockImplementation(useApiKeyDefaultImp);
  mockUseServiceAccountAuth.mockImplementation(useServiceAccountAuthDefaultImp);
  mockLoadInfo.mockImplementation(loadInfoDefaultImp);
  const sheet = await getSheet({
    connection: {
      client_email: 'client_email',
      private_key: 'private_key',
      spreadsheetId: 'spreadsheetId',
      sheetIndex: 0,
    },
  });
  expect(mockUseApiKey.mock.calls).toEqual([]);
  expect(mockUseServiceAccountAuth.mock.calls).toEqual([
    [
      {
        client_email: 'client_email',
        private_key: 'private_key',
      },
    ],
  ]);
  expect(mockLoadInfo.mock.calls).toEqual([[]]);
  expect(sheet).toEqual({ index: 0 });
});

test('getSheet with invalid apiKey', async () => {
  mockUseApiKey.mockImplementation(useApiKeyDefaultImp);
  mockUseServiceAccountAuth.mockImplementation(useServiceAccountAuthDefaultImp);
  mockLoadInfo.mockImplementation(loadInfoDefaultImp);
  await expect(() =>
    getSheet({
      connection: {
        apiKey: 'invalid',
        spreadsheetId: 'spreadsheetId',
        sheetId: 'sheetId1',
      },
    })
  ).rejects.toThrow('Test Api Key Auth Error.');
  expect(mockUseApiKey.mock.calls).toEqual([['invalid']]);
});

test('getSheet with invalid client_id', async () => {
  mockUseApiKey.mockImplementation(useApiKeyDefaultImp);
  mockUseServiceAccountAuth.mockImplementation(useServiceAccountAuthDefaultImp);
  mockLoadInfo.mockImplementation(loadInfoDefaultImp);
  await expect(() =>
    getSheet({
      connection: {
        client_email: 'invalid_client_email',
        private_key: 'private_key',
        spreadsheetId: 'spreadsheetId',
        sheetId: 'sheetId1',
      },
    })
  ).rejects.toThrow('Test Service Account Auth Error.');
  expect(mockUseServiceAccountAuth.mock.calls).toEqual([
    [
      {
        client_email: 'invalid_client_email',
        private_key: 'private_key',
      },
    ],
  ]);
});

test('getSheet with invalid private_key', async () => {
  mockUseApiKey.mockImplementation(useApiKeyDefaultImp);
  mockUseServiceAccountAuth.mockImplementation(useServiceAccountAuthDefaultImp);
  mockLoadInfo.mockImplementation(loadInfoDefaultImp);
  await expect(() =>
    getSheet({
      connection: {
        client_email: 'client_email',
        private_key: 'invalid_private_key',
        spreadsheetId: 'spreadsheetId',
        sheetId: 'sheetId1',
      },
    })
  ).rejects.toThrow('Test Service Account Auth Error.');
  expect(mockUseServiceAccountAuth.mock.calls).toEqual([
    [
      {
        client_email: 'client_email',
        private_key: 'invalid_private_key',
      },
    ],
  ]);
});

test('getSheet with sheetId, sheet does not exist', async () => {
  mockUseApiKey.mockImplementation(useApiKeyDefaultImp);
  mockUseServiceAccountAuth.mockImplementation(useServiceAccountAuthDefaultImp);
  mockLoadInfo.mockImplementation(loadInfoDefaultImp);
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
  mockUseApiKey.mockImplementation(useApiKeyDefaultImp);
  mockUseServiceAccountAuth.mockImplementation(useServiceAccountAuthDefaultImp);
  mockLoadInfo.mockImplementation(loadInfoDefaultImp);
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
