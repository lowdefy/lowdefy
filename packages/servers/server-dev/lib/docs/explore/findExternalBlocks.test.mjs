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

import findAuthActionBlocks from './findAuthActionBlocks.js';
import findExternalBlocks from './findExternalBlocks.js';

let buildDirectory;

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
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-external-'));
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
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('findExternalBlocks lists blocks whose events reach a connection a data set does not redirect', () => {
  expect(findExternalBlocks({ buildDirectory, pageId: 'tickets' })).toEqual({
    blocks: {
      invite: ['mailer'],
      hook: ['webhook'],
      all: ['mailer', 'webhook'],
      assign: ['mailer'],
    },
  });
});

test('findExternalBlocks throws for a page with no build artifact', () => {
  expect(() => findExternalBlocks({ buildDirectory, pageId: 'missing' })).toThrow(
    `Page "missing" has no build artifact in ${buildDirectory}.`
  );
});

test('findAuthActionBlocks lists blocks whose events run an auth-engine action', () => {
  expect(findAuthActionBlocks({ buildDirectory, pageId: 'tickets' })).toEqual([
    'sign_out',
    'change_password',
  ]);
});
