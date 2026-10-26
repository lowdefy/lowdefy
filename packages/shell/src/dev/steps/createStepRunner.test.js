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
import { Pressable, Text, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createNativeGlobals, LowdefyPage } from '@lowdefy/client-native';
import { SetState } from '@lowdefy/actions-core/actions';
import { _state } from '@lowdefy/operators-js/operators/client';

import createMemoryStore from '../../host/createMemoryStore.js';
import createStepRunner from './createStepRunner.js';

// Stand-ins for native blocks: a container, a button, a text input and a selector.
function Box({ content }) {
  return <View>{content.content?.()}</View>;
}
Box.meta = { category: 'container', slots: { content: 'Child blocks.' } };

function Button({ methods, properties }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => methods.triggerEvent({ name: 'onClick' })}>
      <Text>{properties.title}</Text>
    </Pressable>
  );
}
Button.meta = { category: 'display' };

function TextInput({ blockId, value }) {
  return <Text testID={`${blockId}-value`}>{value ?? ''}</Text>;
}
TextInput.meta = { category: 'input', valueType: 'string' };

function Selector({ blockId, value }) {
  return <Text testID={`${blockId}-value`}>{JSON.stringify(value ?? null)}</Text>;
}
Selector.meta = { category: 'input', valueType: 'any' };

// An action that takes a while, so a step that returns before its chain ends would be seen.
function Pause({ params }) {
  return new Promise((resolve) => {
    setTimeout(resolve, params.ms);
  });
}

const types = {
  actions: { Pause, SetState },
  blocks: { Box, Button, Selector, TextInput },
  operators: { _state },
};

function block({ id, type, events, ...rest }) {
  const built = { id: `block:form:${id}:0`, blockId: id, type, ...rest };
  if (events) {
    built.events = Object.fromEntries(
      Object.entries(events).map(([name, actions]) => [name, { try: actions, catch: [] }])
    );
  }
  return built;
}

const pageConfig = {
  id: 'page:form',
  pageId: 'form',
  blockId: 'form',
  type: 'Box',
  path: 'form',
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
            onPressEnter: [{ id: 'enter', type: 'SetState', params: { entered: true } }],
          },
        }),
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
            onClick: [
              { id: 'pause', type: 'Pause', params: { ms: 200 } },
              { id: 'saved', type: 'SetState', params: { saved: true } },
            ],
          },
        }),
        block({ id: 'locked', type: 'Button', properties: { title: 'Locked', disabled: true } }),
        block({ id: 'hidden', type: 'Button', visible: false, properties: { title: 'Hidden' } }),
      ],
    },
  },
};

const rootConfig = {
  classMap: {},
  home: { configured: true, pageId: 'form' },
  lowdefyApp: { slug: 'test-app' },
  menus: [],
  pagePaths: { form: 'form' },
  theme: { light: {}, dark: {} },
};

async function renderForm() {
  const fetch = jest.fn();
  const host = {
    fetch,
    globals: createNativeGlobals({
      assign: jest.fn(),
      fetch,
      getPath: () => '/form',
      origin: 'https://app.lowdefy.test',
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
  const core = {
    apiBase: 'https://app.lowdefy.test',
    auth: { authConfig: {} },
    basePath: '',
    lowdefy,
  };
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
  const capture = jest.fn(async () => 'iVBORw0KGgo=');
  const runner = createStepRunner({ capture, getLowdefy: () => lowdefy, timeout: 300 });
  const state = () => lowdefy.contexts['page:form'].state;
  async function run(step) {
    let result;
    await act(async () => {
      result = await runner.run({ step });
    });
    return result;
  }
  async function fail(step) {
    let error;
    await act(async () => {
      error = await runner.run({ step }).catch((caught) => caught);
    });
    return error.message;
  }
  return { capture, fail, run, state };
}

test('a click step finds the block by the id its view carries as testID and waits for its action chain', async () => {
  const { run, state } = await renderForm();
  expect(screen.getByTestId('save')).toBeTruthy();
  const result = await run({ click: 'save' });
  expect(result).toEqual({ ok: true, settled: true });
  expect(state().saved).toBe(true);
});

test('a click step takes a { blockId } target', async () => {
  const { run, state } = await renderForm();
  await run({ click: { blockId: 'save' } });
  expect(state().saved).toBe(true);
});

test('a fill step sets an input and runs its onChange, which the page then shows', async () => {
  const { run, state } = await renderForm();
  await run({ fill: { blockId: 'title', value: 'Quarterly' } });
  expect(state().title).toBe('Quarterly');
  expect(state().echo).toBe('Quarterly');
  expect(screen.getByTestId('title-value').props.children).toBe('Quarterly');
});

test('a press Enter step runs the onPressEnter of the input filled last', async () => {
  const { run, state } = await renderForm();
  await run({ fill: { blockId: 'title', value: 'Quarterly' } });
  await run({ press: 'Enter' });
  expect(state().entered).toBe(true);
});

test('a select step picks the option by its label', async () => {
  const { run, state } = await renderForm();
  await run({ select: { blockId: 'priority', value: 'High' } });
  expect(state().priority).toBe('high');
});

test('a wait step waits for state to be set', async () => {
  const { run, state } = await renderForm();
  await act(async () => {
    fireEvent.press(screen.getByText('Save'));
  });
  expect(state().saved).toBeUndefined();
  expect(await run({ wait: { state: 'saved' } })).toEqual({ ok: true });
  expect(state().saved).toBe(true);
});

test('a screenshot step captures the root view', async () => {
  const { capture, run } = await renderForm();
  expect(await run({ screenshot: 'after-save' })).toEqual({
    ok: true,
    name: 'after-save',
    image: 'iVBORw0KGgo=',
  });
  expect(capture).toHaveBeenCalledTimes(1);
});

test('steps that cannot run say why', async () => {
  const { fail } = await renderForm();
  expect(await fail({ click: 'missing' })).toBe(
    'Block "missing" is not on page "form". Waited 300 ms.'
  );
  expect(await fail({ click: 'hidden' })).toBe('Block "hidden" is not visible. Waited 300 ms.');
  expect(await fail({ click: 'locked' })).toBe('Block "locked" is disabled.');
  expect(await fail({ fill: { blockId: 'save', value: 'x' } })).toBe(
    'Block "save" is not an input.'
  );
  expect(await fail({ select: { blockId: 'priority', value: 'Urgent' } })).toBe(
    'Block "priority" has no option "Urgent". Its options are ["Low","High"].'
  );
  expect(await fail({ press: 'Enter' })).toBe('Press "Enter" needs an input filled before it.');
  expect(await fail({ press: 'Tab' })).toBe('A phone presses only "Enter". Received "Tab".');
  expect(await fail({ click: { blockId: 'save', text: 'Save' } })).toMatch(/by blockId only/);
  expect(await fail({ goto: 'home' })).toBe(
    'A phone runs the steps click, fill, select, press, wait, screenshot. Received "goto".'
  );
});
