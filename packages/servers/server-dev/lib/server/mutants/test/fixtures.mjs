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

import keyArtifact from './keyArtifact.mjs';

// A page artifact as the dev server reads build/pages/tickets.json: blocks in
// slots, actions in events try/catch, and the JIT copy of each request with
// its properties still in it. Event and slot containers are made by the
// build, so they carry no ~k.
function pageFixture({ prefix = 'k1_' } = {}) {
  const onInit = {
    try: [{ id: 'init_state', type: 'SetState', params: { tab: 'open' } }],
    catch: [],
  };
  const onClick = {
    try: [
      { id: 'validate', type: 'Validate', params: { regex: '^name' } },
      { id: 'assign', type: 'Request', params: 'assign_ticket' },
      { id: 'notify', type: 'SetState', params: { label: { _if: { test: true, then: 'x' } } } },
      { id: 'go', type: 'Link', params: { pageId: 'ticket', urlQuery: { id: 1 } } },
      { id: 'home_link', type: 'Link', params: 'home' },
      { id: 'out', type: 'Link', params: { url: 'https://example.com' } },
      { id: 'back', type: 'Link', params: { back: true } },
    ],
    catch: [],
  };
  const boxSlot = { blocks: [{ id: 'block:tickets:success', blockId: 'success', type: 'Alert' }] };
  const boxSlots = { content: boxSlot };
  const content = {
    blocks: [
      {
        id: 'block:tickets:title',
        blockId: 'title',
        type: 'Title',
        properties: {
          content: { _if: { test: { _state: 'open' }, then: 'Open', else: 'Closed' } },
        },
      },
      {
        id: 'block:tickets:name',
        blockId: 'name',
        type: 'TextInput',
        required: true,
        validate: [{ pass: { _regex: { pattern: '^.{3,}$' } }, message: 'Too short' }],
        properties: { disabled: { _state: 'locked' } },
      },
      {
        id: 'block:tickets:assign_submit',
        blockId: 'assign_submit',
        type: 'Button',
        visible: true,
        events: { onClick },
      },
      {
        id: 'block:tickets:box',
        blockId: 'box',
        type: 'Box',
        visible: { _state: 'show' },
        slots: boxSlots,
      },
    ],
  };
  const slots = { content };
  const events = { onInit };
  const value = {
    id: 'page:tickets',
    type: 'PageHeaderMenu',
    pageId: 'tickets',
    blockId: 'tickets',
    events,
    slots,
    requests: [
      {
        id: 'request:tickets:assign_ticket',
        requestId: 'assign_ticket',
        pageId: 'tickets',
        type: 'MongoDBUpdateOne',
        connectionId: 'tickets',
        payload: {
          ticket_id: { _state: 'ticket_id' },
          assignee: { _state: 'assignee' },
          priority: { _if: { test: { _state: 'urgent' }, then: 'high', else: 'normal' } },
        },
        properties: { filter: { _if: { test: true, then: { a: 1 }, else: { a: 2 } } } },
        auth: { public: true },
      },
    ],
  };
  return keyArtifact({
    value,
    prefix,
    unkeyed: [events, onInit, onClick, slots, content, boxSlots, boxSlot],
  });
}

function eventsFixture() {
  return keyArtifact({
    value: {
      onInit: {
        try: [
          { id: 'to_login', type: 'Link', params: { pageId: 'login' } },
          { id: 'check', type: 'Validate' },
          {
            id: 'fail',
            type: 'Throw',
            params: { message: { _if: { test: { _user: 'id' }, then: 'a', else: 'b' } } },
          },
        ],
        catch: [],
      },
    },
  });
}

function requestFixture() {
  return keyArtifact({
    value: {
      id: 'request:tickets:assign_ticket',
      requestId: 'assign_ticket',
      pageId: 'tickets',
      type: 'MongoDBUpdateOne',
      connectionId: 'tickets',
      payload: { ticket_id: { _state: 'ticket_id' } },
      properties: {
        filter: { _id: { _payload: 'ticket_id' } },
        update: { $set: { status: { _if: { test: true, then: 'assigned', else: 'open' } } } },
      },
    },
  });
}

function endpointFixture() {
  return keyArtifact({
    value: {
      id: 'endpoint:notify',
      endpointId: 'notify',
      type: 'Api',
      routine: [
        {
          id: 'endpoint:notify:find',
          stepId: 'find',
          type: 'MongoDBFindOne',
          properties: {
            query: { _if: { test: { _payload: 'all' }, then: {}, else: { open: true } } },
            doc: { id: 'not-a-step', type: 'value' },
          },
        },
        {
          ':if': { _payload: 'urgent' },
          ':then': [{ id: 'endpoint:notify:page', stepId: 'page', type: 'AxiosHttp' }],
          ':else': [{ id: 'endpoint:notify:log', stepId: 'log', type: 'MongoDBInsertOne' }],
        },
        { ':if': true, ':then': [] },
        { ':return': { ok: true } },
      ],
    },
  });
}

export { endpointFixture, eventsFixture, pageFixture, requestFixture };
