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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import createDataSetRails from './createDataSetRails.js';

let buildDirectory;

const connections = {
  MongoDBCollection: { meta: { tenant: true, dataSet: 'redirect' } },
  AxiosHttp: { meta: { dataSet: 'external' } },
  FolderRuntime: { meta: { dataSet: 'redirect' } },
  WalledRuntime: { meta: { tenant: false, dataSet: 'walled' } },
  Knex: {},
};

function write(name, value) {
  const filePath = path.join(buildDirectory, name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
}

function button(blockId, ...actions) {
  return {
    blockId,
    type: 'Button',
    events: { onClick: { try: actions, catch: [] } },
  };
}

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-rails-'));
  write('pages/orders.json', {
    pageId: 'orders',
    blockId: 'orders',
    requests: [{ requestId: 'save' }, { requestId: 'notify' }],
    slots: {
      content: {
        blocks: [
          button('save_button', { id: 's', type: 'Request', params: 'save' }),
          button('notify_button', { id: 'n', type: 'Request', params: 'notify' }),
          button('logout_button', { id: 'l', type: 'Logout' }),
          button('accept_button', { id: 'a', type: 'Request', params: 'accept' }),
          button('archive_button', { id: 'a', type: 'Request', params: 'archive' }),
          button('report_button', { id: 'r', type: 'Request', params: 'report' }),
          button('orphan_button', { id: 'o', type: 'Request', params: 'orphan' }),
          button(
            'everything_button',
            { id: 'n', type: 'Request', params: 'notify' },
            { id: 'r', type: 'Request', params: 'report' },
            { id: 'o', type: 'Request', params: 'orphan' }
          ),
          {
            blockId: 'rows',
            type: 'List',
            slots: {
              content: {
                blocks: [button('rows.$.notify', { id: 'n', type: 'Request', params: 'notify' })],
              },
            },
          },
        ],
      },
    },
  });
  write('pages/orders/requests/save.json', { requestId: 'save', connectionId: 'orders_db' });
  write('pages/orders/requests/notify.json', { requestId: 'notify', connectionId: 'mailer' });
  write('connections/orders_db.json', { connectionId: 'orders_db', type: 'MongoDBCollection' });
  write('connections/mailer.json', { connectionId: 'mailer', type: 'AxiosHttp' });
  write('pages/orders/requests/accept.json', { requestId: 'accept', connectionId: 'runtime' });
  write('pages/orders/requests/archive.json', { requestId: 'archive', connectionId: 'folders' });
  write('pages/orders/requests/report.json', { requestId: 'report', connectionId: 'sql' });
  write('pages/orders/requests/orphan.json', { requestId: 'orphan', connectionId: 'gone' });
  write('connections/runtime.json', { connectionId: 'runtime', type: 'WalledRuntime' });
  write('connections/folders.json', { connectionId: 'folders', type: 'FolderRuntime' });
  write('connections/sql.json', { connectionId: 'sql', type: 'Knex' });
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('a block whose request uses a MongoDBCollection connection, declaring redirect, may be clicked', () => {
  const rails = createDataSetRails({ buildDirectory, connections });
  expect(rails.refusal({ pageId: 'orders', blockId: 'save_button' })).toBeNull();
});

test('a block that reaches a plugin type declaring redirect or walled may be clicked', () => {
  const rails = createDataSetRails({ buildDirectory, connections });
  expect(rails.refusal({ pageId: 'orders', blockId: 'archive_button' })).toBeNull();
  expect(rails.refusal({ pageId: 'orders', blockId: 'accept_button' })).toBeNull();
});

test('a block that reaches a connection declaring external is refused, naming the declaration', () => {
  const rails = createDataSetRails({ buildDirectory, connections });
  expect(rails.refusal({ pageId: 'orders', blockId: 'notify_button' })).toEqual({
    message:
      'Block "notify_button" reaches connection "mailer" (AxiosHttp, dataSet: external), which reaches a real service, so a data-set journey cannot click it.',
    actual: 'a click that reaches connection "mailer" (AxiosHttp, dataSet: external)',
  });
});

test('a block that reaches a connection whose type declares nothing is refused, saying so', () => {
  const rails = createDataSetRails({ buildDirectory, connections });
  expect(rails.refusal({ pageId: 'orders', blockId: 'report_button' })).toEqual({
    message:
      'Block "report_button" reaches connection "sql" (Knex, no dataSet declaration), which a data set cannot redirect, so a data-set journey cannot click it.',
    actual: 'a click that reaches connection "sql" (Knex, no dataSet declaration)',
  });
});

test('a block that reaches a connection with no artifact is refused, saying so', () => {
  const rails = createDataSetRails({ buildDirectory, connections });
  expect(rails.refusal({ pageId: 'orders', blockId: 'orphan_button' })).toEqual({
    message:
      'Block "orphan_button" reaches connection "gone" (no connection artifact), which a data set cannot redirect, so a data-set journey cannot click it.',
    actual: 'a click that reaches connection "gone" (no connection artifact)',
  });
});

test('a block that reaches several refused connections names each with its declaration', () => {
  const rails = createDataSetRails({ buildDirectory, connections });
  expect(rails.refusal({ pageId: 'orders', blockId: 'everything_button' })).toEqual({
    message:
      'Block "everything_button" reaches connection "gone" (no connection artifact), which a data set cannot redirect, and connection "mailer" (AxiosHttp, dataSet: external), which reaches a real service, and connection "sql" (Knex, no dataSet declaration), which a data set cannot redirect, so a data-set journey cannot click it.',
    actual:
      'a click that reaches connection "gone" (no connection artifact), "mailer" (AxiosHttp, dataSet: external), "sql" (Knex, no dataSet declaration)',
  });
});

test('a MongoDBCollection connection is refused when the connection map does not declare it', () => {
  const { MongoDBCollection, ...withoutMongo } = connections;
  const rails = createDataSetRails({ buildDirectory, connections: withoutMongo });
  expect(rails.refusal({ pageId: 'orders', blockId: 'save_button' })?.actual).toBe(
    'a click that reaches connection "orders_db" (MongoDBCollection, no dataSet declaration)'
  );
});

test('a list item block is matched through its template id', () => {
  const rails = createDataSetRails({ buildDirectory, connections });
  expect(rails.refusal({ pageId: 'orders', blockId: 'rows.2.notify' })?.actual).toBe(
    'a click that reaches connection "mailer" (AxiosHttp, dataSet: external)'
  );
});

test('a block that runs an auth action is not refused: the auth rail acts at runtime', () => {
  const rails = createDataSetRails({ buildDirectory, connections });
  expect(rails.refusal({ pageId: 'orders', blockId: 'logout_button' })).toBeNull();
});

test("a page's lists are read once per run", () => {
  const rails = createDataSetRails({ buildDirectory, connections });
  expect(rails.refusal({ pageId: 'orders', blockId: 'save_button' })).toBeNull();
  fs.rmSync(path.join(buildDirectory, 'pages'), { recursive: true });
  expect(rails.refusal({ pageId: 'orders', blockId: 'notify_button' })).not.toBeNull();
});
