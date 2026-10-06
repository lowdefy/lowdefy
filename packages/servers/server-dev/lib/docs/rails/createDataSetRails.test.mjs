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
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('a block whose request uses the data set connection may be clicked', () => {
  const rails = createDataSetRails({ buildDirectory });
  expect(rails.refusal({ pageId: 'orders', blockId: 'save_button' })).toBeNull();
});

test('a block that reaches another connection is refused, naming the connection and its type', () => {
  const rails = createDataSetRails({ buildDirectory });
  expect(rails.refusal({ pageId: 'orders', blockId: 'notify_button' })).toEqual({
    message:
      'Block "notify_button" reaches connection "mailer" (AxiosHttp), which a journey data set does not redirect, so a data-set journey cannot click it.',
    actual: 'a click that reaches connection "mailer" (AxiosHttp)',
  });
});

test('a list item block is matched through its template id', () => {
  const rails = createDataSetRails({ buildDirectory });
  expect(rails.refusal({ pageId: 'orders', blockId: 'rows.2.notify' })?.actual).toBe(
    'a click that reaches connection "mailer" (AxiosHttp)'
  );
});

test('a block that runs an auth action is refused, naming the action', () => {
  const rails = createDataSetRails({ buildDirectory });
  expect(rails.refusal({ pageId: 'orders', blockId: 'logout_button' })).toEqual({
    message:
      'Block "logout_button" runs the auth action Logout, so a data-set journey cannot click it: its users are injected and have no auth session.',
    actual: 'a click that runs the auth action Logout',
  });
});

test("a page's lists are read once per run", () => {
  const rails = createDataSetRails({ buildDirectory });
  expect(rails.refusal({ pageId: 'orders', blockId: 'save_button' })).toBeNull();
  fs.rmSync(path.join(buildDirectory, 'pages'), { recursive: true });
  expect(rails.refusal({ pageId: 'orders', blockId: 'logout_button' })).not.toBeNull();
});
