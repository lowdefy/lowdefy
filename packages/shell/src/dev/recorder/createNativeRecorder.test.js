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

import React from 'react';
import { jest } from '@jest/globals';
import { Pressable, Text, TextInput as RNTextInput, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createNativeGlobals, LowdefyPage } from '@lowdefy/client-native';
import { SetState } from '@lowdefy/actions-core/actions';
import { _state } from '@lowdefy/operators-js/operators/client';
import validateTraceRecord from '@lowdefy/node-utils/journeyTrace/validateTraceRecord.js';

import createMemoryStore from '../../host/createMemoryStore.js';
import createNativeRecorder from './createNativeRecorder.js';

// The records the dev server's recording validation runs over (server-dev
// src/routes/devRecording.test.mjs): what this recorder writes for a click, a fill and a select.
const fixture = require('../../../../servers/server-dev/test/nativeRecordingFixture.json');

// Stand-ins for native blocks that call their methods as blocks-native's do.
function Box({ content }) {
  return <View>{content.content?.()}</View>;
}
Box.meta = { category: 'container', slots: { content: 'Child blocks.' } };

function Button({ blockId, methods, properties }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => methods.triggerEvent({ name: 'onClick' })}
      testID={`${blockId}-press`}
    >
      <Text>{properties.title}</Text>
    </Pressable>
  );
}
Button.meta = { category: 'display' };

function TextInput({ blockId, methods, properties, value }) {
  return (
    <RNTextInput
      onChangeText={(text) => {
        methods.setValue(text);
        methods.triggerEvent({ name: 'onChange', event: { value: text } });
      }}
      onSubmitEditing={() => methods.triggerEvent({ name: 'onPressEnter' })}
      secureTextEntry={properties.type === 'password'}
      testID={`${blockId}_input`}
      value={value ?? ''}
    />
  );
}
TextInput.meta = { category: 'input', valueType: 'string' };

function Selector({ blockId, methods, properties }) {
  return (
    <View>
      {properties.options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => {
            methods.setValue(option.value);
            methods.triggerEvent({ name: 'onChange', event: { value: option.value } });
          }}
          testID={`${blockId}-${option.value}`}
        >
          <Text>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
Selector.meta = { category: 'input', valueType: 'any' };

const types = {
  actions: { SetState },
  blocks: { Box, Button, Selector, TextInput },
  operators: { _state },
};

function block({ id, type, events, ...rest }) {
  const built = { id: `block:ticket:${id}:0`, blockId: id, type, ...rest };
  if (events) {
    built.events = Object.fromEntries(
      Object.entries(events).map(([name, actions]) => [name, { try: actions, catch: [] }])
    );
  }
  return built;
}

const pageConfig = {
  id: 'page:ticket',
  pageId: 'ticket',
  blockId: 'ticket',
  type: 'Box',
  path: 'ticket',
  linkPaths: {},
  subscriptions: [],
  requests: [],
  slots: {
    content: {
      blocks: [
        block({
          id: 'title',
          type: 'TextInput',
          events: {
            onChange: [{ id: 'echo', type: 'SetState', params: { echo: { _state: 'title' } } }],
          },
        }),
        block({ id: 'secret', type: 'TextInput', properties: { type: 'password' } }),
        block({
          id: 'priority',
          type: 'Selector',
          properties: {
            options: [
              { label: 'Low', value: 'low' },
              { label: 'High', value: 'high' },
            ],
          },
        }),
        block({
          id: 'save',
          type: 'Button',
          properties: { title: 'Save' },
          events: {
            onClick: [{ id: 'saved', type: 'SetState', params: { saved: true } }],
          },
        }),
      ],
    },
  },
};

const rootConfig = {
  classMap: {},
  home: { configured: true, pageId: 'ticket' },
  lowdefyApp: { slug: 'test-app' },
  menus: [],
  pagePaths: { ticket: 'ticket' },
  theme: { light: {}, dark: {} },
};

const apiBase = 'http://192.168.1.20:3000';

async function renderTicket() {
  const fetch = jest.fn();
  const host = {
    fetch,
    globals: createNativeGlobals({
      assign: jest.fn(),
      fetch,
      getPath: () => '/ticket?from=list',
      origin: apiBase,
    }),
    onBuildChanged: jest.fn(),
    onCallerChanged: jest.fn(),
    router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
    sessionStorage: createMemoryStore(),
    storage: createMemoryStore(),
    WebSocket: jest.fn(),
    websocketUrl: (apiPath) => apiPath,
  };
  const lowdefy = {};
  const core = { apiBase, auth: { authConfig: {} }, basePath: '', lowdefy };
  await render(
    <LowdefyPage
      core={core}
      host={host}
      pageConfig={pageConfig}
      rootConfig={rootConfig}
      types={types}
    />
  );
  await screen.findByText('Save');
  return lowdefy;
}

function startRecorder(lowdefy) {
  const posts = [];
  const fetch = jest.fn(async (url, init) => {
    posts.push({ url, body: JSON.parse(init.body) });
    return { ok: true, status: 204 };
  });
  const kv = createMemoryStore();
  const recorder = createNativeRecorder({
    apiBase,
    device: 'ios',
    fetch,
    getBuild: () => 'build-1',
    getLowdefy: () => lowdefy,
    kv,
    shellVersion: '7.4.0',
  });
  recorder.start();
  return { kv, posts, recorder };
}

function recordsOf(posts) {
  return posts.flatMap((post) => post.body.records);
}

// Times and the session id differ on every run; the fixture keeps their order.
function normalise(records) {
  const start = Date.parse('2026-10-18T09:00:00.000Z');
  return records.map((record, index) => ({
    ...record,
    session: '20261018T090000Z-ph0ne1',
    t: new Date(start + index * 1000).toISOString(),
  }));
}

async function act$(callback) {
  await act(async () => {
    callback();
  });
}

let running;
afterEach(async () => {
  await running?.recorder.stop();
  running = null;
});

test('a click, a fill and a select are recorded by block id, paired with the events they ran', async () => {
  const lowdefy = await renderTicket();
  running = startRecorder(lowdefy);
  await act$(() => fireEvent.changeText(screen.getByTestId('title_input'), 'Pump'));
  await act$(() => fireEvent.press(screen.getByTestId('priority-high')));
  await act$(() => fireEvent.press(screen.getByTestId('save-press')));
  await running.recorder.flush();

  const { posts } = running;
  expect(posts.map((post) => post.url)).toEqual([`${apiBase}/api/dev-recording`]);
  const records = recordsOf(posts);
  expect(records.every((record) => record.session === posts[0].body.session)).toBe(true);
  expect(normalise(records)).toEqual(fixture.records);
});

test('every record passes the trace record validation once the dev server stamps its source', async () => {
  const lowdefy = await renderTicket();
  running = startRecorder(lowdefy);
  await act$(() => fireEvent.changeText(screen.getByTestId('title_input'), 'Pump'));
  await act$(() => fireEvent.press(screen.getByTestId('save-press')));
  await running.recorder.flush();
  const records = recordsOf(running.posts);
  expect(records.length).toBeGreaterThan(0);
  records.forEach((record) => {
    expect(validateTraceRecord({ record: { ...record, source: 'dev' } })).toEqual({});
  });
});

test('a password input is never recorded', async () => {
  const lowdefy = await renderTicket();
  running = startRecorder(lowdefy);
  await act$(() => fireEvent.changeText(screen.getByTestId('secret_input'), 'hunter2'));
  await running.recorder.flush();
  const change = recordsOf(running.posts).find((record) => record.kind === 'change');
  expect(change).toMatchObject({ target: { block_id: 'secret' }, value: null, redacted: true });
  expect(JSON.stringify(recordsOf(running.posts))).not.toContain('hunter2');
});

test('pressing Enter in an input is recorded as an Enter key on its block', async () => {
  const lowdefy = await renderTicket();
  running = startRecorder(lowdefy);
  await act$(() => fireEvent(screen.getByTestId('title_input'), 'submitEditing'));
  await running.recorder.flush();
  const key = recordsOf(running.posts).find((record) => record.kind === 'key');
  expect(key).toMatchObject({ key: 'Enter', target: { block_id: 'title' }, page_id: 'ticket' });
});

test('the session is kept in the device store, so a new recorder carries it on', async () => {
  const lowdefy = await renderTicket();
  running = startRecorder(lowdefy);
  await running.recorder.flush();
  const [first] = recordsOf(running.posts);
  const again = createNativeRecorder({
    apiBase,
    device: 'android',
    fetch: jest.fn(async () => ({ ok: true })),
    getBuild: () => null,
    getLowdefy: () => lowdefy,
    kv: running.kv,
    shellVersion: '7.4.0',
  });
  const stored = JSON.parse(running.kv.get('lowdefy_dev_recording'));
  expect(stored.id).toBe(first.session);
  await again.stop();
});

test('with no open app the recorder records nothing', async () => {
  running = startRecorder(null);
  await running.recorder.flush();
  expect(running.posts).toEqual([]);
});
