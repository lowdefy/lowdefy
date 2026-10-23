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

import findExternalBlocks from './findExternalBlocks.js';
import { afterEach, beforeEach, expect, test } from 'vitest';

let buildDirectory;

const connections = {
  MongoDBCollection: { meta: { tenant: true, dataSet: 'redirect' } },
  AxiosHttp: { meta: { dataSet: 'external' } },
  FolderRuntime: { meta: { dataSet: 'redirect' } },
  WalledRuntime: {
    meta: { tenant: false, dataSet: 'walled' },
    // A request type that declares external is sunk, so the walled connection stays clickable.
    requests: { Fetch: Object.assign(() => null, { meta: { dataSet: 'external' } }) },
  },
  Knex: {},
  PluginStore: { meta: { dataSet: 'mongo' } },
};

function write(name, value) {
  const filePath = path.join(buildDirectory, name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
}

function onClick(...actions) {
  return { onClick: { try: { '~arr': actions }, catch: { '~arr': [] } } };
}

function block(blockId, events, blocks) {
  return {
    id: `block:tickets:${blockId}:0`,
    blockId,
    type: 'Button',
    events,
    ...(blocks ? { slots: { content: { blocks: { '~arr': blocks } } } } : {}),
    '~k': blockId,
  };
}

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-rails-external-'));
  write('pages/tickets.json', {
    id: 'page:tickets',
    pageId: 'tickets',
    blockId: 'tickets',
    events: { onMount: { try: [{ id: 'all', type: 'Request', params: { all: true } }] } },
    requests: {
      '~arr': [
        { requestId: 'get_tickets' },
        { requestId: 'send_mail' },
        { requestId: 'post_hook' },
      ],
    },
    slots: {
      content: {
        blocks: {
          '~arr': [
            block('refresh', onClick({ id: 'r', type: 'Request', params: 'get_tickets' })),
            block(
              'invite',
              onClick({ id: 'r', type: 'Request', params: ['get_tickets', 'send_mail'] })
            ),
            block(
              'hook',
              onClick({ id: 'r', type: 'Request', params: { requestId: 'post_hook' } })
            ),
            block('all', onClick({ id: 'r', type: 'Request', params: { all: true } })),
            block('card', {}, [
              block(
                'assign',
                onClick({ id: 'c', type: 'CallAPI', params: { endpointId: 'assign' } })
              ),
              block('save', onClick({ id: 'c', type: 'CallAPI', params: { endpointId: 'save' } })),
              block(
                'ghost',
                onClick({ id: 'c', type: 'CallAPI', params: { endpointId: 'missing' } })
              ),
              block(
                'dynamic',
                onClick({ id: 'c', type: 'CallAPI', params: { endpointId: { _state: 'id' } } })
              ),
            ]),
            block('accept', onClick({ id: 'r', type: 'Request', params: 'accept_match' })),
            block('archive', onClick({ id: 'r', type: 'Request', params: 'move_folder' })),
            block('report', onClick({ id: 'r', type: 'Request', params: 'run_sql' })),
            block('stash', onClick({ id: 'r', type: 'Request', params: 'store_row' })),
            block('orphan', onClick({ id: 'r', type: 'Request', params: 'orphan' })),
            block('sign_out', onClick({ id: 'l', type: 'Logout' })),
            block('change_password', {
              onSubmit: { try: [], catch: [{ id: 'p', type: 'ChangePassword' }] },
            }),
          ],
        },
      },
    },
  });
  write('pages/tickets/requests/get_tickets.json', {
    requestId: 'get_tickets',
    connectionId: 'tickets_db',
  });
  write('pages/tickets/requests/send_mail.json', {
    requestId: 'send_mail',
    connectionId: 'mailer',
  });
  write('pages/tickets/requests/post_hook.json', {
    requestId: 'post_hook',
    connectionId: 'webhook',
  });
  write('pages/tickets/requests/accept_match.json', {
    requestId: 'accept_match',
    connectionId: 'runtime',
  });
  write('pages/tickets/requests/move_folder.json', {
    requestId: 'move_folder',
    connectionId: 'folders',
  });
  write('pages/tickets/requests/run_sql.json', { requestId: 'run_sql', connectionId: 'sql' });
  write('pages/tickets/requests/store_row.json', { requestId: 'store_row', connectionId: 'store' });
  write('pages/tickets/requests/orphan.json', { requestId: 'orphan', connectionId: 'gone' });
  write('api/assign.json', {
    endpointId: 'assign',
    routine: {
      '~arr': [
        {
          id: 'request:assign:update',
          type: 'MongoDBUpdateOne',
          stepId: 'update',
          connectionId: 'tickets_db',
        },
        {
          ':if': true,
          ':then': [
            {
              id: 'endpoint:assign:n',
              type: 'CallApi',
              stepId: 'n',
              properties: { endpointId: 'notify' },
            },
          ],
        },
      ],
    },
  });
  write('api/notify.json', {
    endpointId: 'notify',
    routine: [
      { id: 'request:notify:send', type: 'AxiosHttp', stepId: 'send', connectionId: 'mailer' },
      {
        id: 'endpoint:notify:a',
        type: 'CallApi',
        stepId: 'a',
        properties: { endpointId: 'assign' },
      },
    ],
  });
  write('api/save.json', {
    endpointId: 'save',
    routine: [
      { id: 'request:save:s', type: 'MongoDBInsertOne', stepId: 's', connectionId: 'tickets_db' },
    ],
  });
  write('connections/tickets_db.json', { connectionId: 'tickets_db', type: 'MongoDBCollection' });
  write('connections/mailer.json', { connectionId: 'mailer', type: 'AxiosHttp' });
  write('connections/webhook.json', { connectionId: 'webhook', type: 'AxiosHttp' });
  write('connections/runtime.json', { connectionId: 'runtime', type: 'WalledRuntime' });
  write('connections/folders.json', { connectionId: 'folders', type: 'FolderRuntime' });
  write('connections/sql.json', { connectionId: 'sql', type: 'Knex' });
  write('connections/store.json', { connectionId: 'store', type: 'PluginStore' });
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

const mailer = { connectionId: 'mailer', type: 'AxiosHttp', dataSet: 'external' };
const webhook = { connectionId: 'webhook', type: 'AxiosHttp', dataSet: 'external' };

test('findExternalBlocks lists blocks whose events reach a connection declaring external, nothing, or with no artifact', () => {
  expect(findExternalBlocks({ buildDirectory, pageId: 'tickets', connections })).toEqual({
    blocks: {
      invite: [mailer],
      hook: [webhook],
      all: [mailer, webhook],
      assign: [mailer],
      report: [{ connectionId: 'sql', type: 'Knex', dataSet: null }],
      stash: [{ connectionId: 'store', type: 'PluginStore', dataSet: 'mongo' }],
      orphan: [{ connectionId: 'gone', type: null, dataSet: null }],
    },
  });
});

test('findExternalBlocks lets a block reach plugin types that declare redirect or walled', () => {
  const { blocks } = findExternalBlocks({ buildDirectory, pageId: 'tickets', connections });
  expect(blocks.accept).toBeUndefined();
  expect(blocks.archive).toBeUndefined();
  expect(blocks.refresh).toBeUndefined();
  expect(blocks.save).toBeUndefined();
});

test('findExternalBlocks refuses MongoDBCollection when the connection map does not declare it', () => {
  const { MongoDBCollection, ...withoutMongo } = connections;
  const { blocks } = findExternalBlocks({
    buildDirectory,
    pageId: 'tickets',
    connections: withoutMongo,
  });
  const ticketsDb = { connectionId: 'tickets_db', type: 'MongoDBCollection', dataSet: null };
  expect(blocks.refresh).toEqual([ticketsDb]);
  expect(blocks.save).toEqual([ticketsDb]);
  expect(blocks.assign).toEqual([mailer, ticketsDb]);
});

test('findExternalBlocks throws for a page with no build artifact', () => {
  expect(() => findExternalBlocks({ buildDirectory, pageId: 'missing', connections })).toThrow(
    `Page "missing" has no build artifact in ${buildDirectory}.`
  );
});

test('findExternalBlocks lets a block reach an external type with request resolvers, which a data session sinks', () => {
  const sinkable = {
    ...connections,
    AxiosHttp: { ...connections.AxiosHttp, requests: { AxiosHttp: () => {} } },
  };
  const { blocks } = findExternalBlocks({
    buildDirectory,
    pageId: 'tickets',
    connections: sinkable,
  });
  expect(blocks.invite).toBeUndefined();
  expect(blocks.hook).toBeUndefined();
  expect(blocks.all).toBeUndefined();
  expect(blocks.assign).toBeUndefined();
  // An undeclared type is still refused.
  expect(blocks.report).toEqual([{ connectionId: 'sql', type: 'Knex', dataSet: null }]);
});
