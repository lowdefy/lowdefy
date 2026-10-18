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

// Builds the form fixture with the Lowdefy build and renders its page with the native blocks,
// the native renderer and the engine: a page of the list, input and action blocks, as a shell
// draws it from what the server sends. The shell registers these blocks in its plugin map later;
// the test adds them to it.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import React from 'react';
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as nativeBlocks from '@lowdefy/blocks-native/blocks';
import { createNativeGlobals, LowdefyPage } from '@lowdefy/client-native';

import createMemoryStore from '../src/host/createMemoryStore.js';
import shellTypes from '../src/plugins/types.js';

// @expo/ui draws SwiftUI and Jetpack Compose views through native modules Jest does not have.
// These stand-ins keep the props the blocks pass.
jest.mock('@expo/ui', () => {
  const { Text, View } = jest.requireActual('react-native');
  const mockReact = jest.requireActual('react');
  function Picker({ children, onValueChange, selectedValue, testID }) {
    const items = mockReact.Children.toArray(children).map((child) => child.props);
    return mockReact.createElement(
      View,
      { items, onValueChange, selectedValue, testID },
      items.map((item) => mockReact.createElement(Text, { key: item.value }, item.label))
    );
  }
  Picker.Item = () => null;
  return {
    Host: ({ children }) => mockReact.createElement(View, null, children),
    Picker,
    Switch: ({ onValueChange, testID, value }) =>
      mockReact.createElement(View, { onValueChange, testID, value }),
  };
});
jest.mock('@expo/ui/community/datetime-picker', () => {
  const { View } = jest.requireActual('react-native');
  const mockReact = jest.requireActual('react');
  return {
    __esModule: true,
    default: ({ onValueChange, testID, value }) =>
      mockReact.createElement(View, { onValueChange, testID, value }),
  };
});

const configDirectory = path.join(__dirname, 'form');
let buildDirectory;
let outDirectory;

function readArtifact(file) {
  return JSON.parse(fs.readFileSync(path.join(buildDirectory, file), 'utf8'));
}

beforeAll(() => {
  outDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-shell-form-'));
  buildDirectory = path.join(outDirectory, 'build');
  execFileSync(
    process.execPath,
    [path.join(__dirname, 'buildFixture.mjs'), configDirectory, outDirectory],
    {
      stdio: 'pipe',
    }
  );
});

afterAll(() => {
  fs.rmSync(outDirectory, { recursive: true, force: true });
});

function createHost() {
  const fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => ({}),
  }));
  return {
    fetch,
    globals: createNativeGlobals({
      assign: jest.fn(),
      fetch,
      getPath: () => '/form',
      origin: 'https://form.example.com',
    }),
    onBuildChanged: jest.fn(),
    onCallerChanged: jest.fn(),
    router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
    sessionStorage: createMemoryStore(),
    storage: createMemoryStore(),
    WebSocket: jest.fn(),
    websocketUrl: (apiPath) => apiPath.replace(/^http/, 'ws'),
  };
}

async function renderFormPage() {
  const onScreenOptions = jest.fn();
  await render(
    <LowdefyPage
      core={{
        apiBase: 'https://form.example.com',
        auth: { authConfig: {} },
        basePath: '',
        lowdefy: { buildId: 'form-build' },
      }}
      host={createHost()}
      onScreenOptions={onScreenOptions}
      pageConfig={readArtifact('pages/form.json')}
      rootConfig={{
        classMap: readArtifact('mobile/classMap.json'),
        home: { configured: true, pageId: 'form' },
        lowdefyApp: {},
        menus: [],
        pagePaths: { form: 'form' },
        theme: readArtifact('mobile/theme.json'),
      }}
      types={{ ...shellTypes, blocks: { ...shellTypes.blocks, ...nativeBlocks } }}
    />
  );
  return { onScreenOptions };
}

test('the form fixture builds with every block from the native block set', () => {
  const pageIndex = readArtifact('mobile/pageIndex.json');
  const typeSet = readArtifact('mobile/typeSets.json')[pageIndex[0].typesKey];
  expect(typeSet.blocks).toEqual(
    [
      'Button',
      'DateSelector',
      'List',
      'ListItem',
      'NumberInput',
      'Screen',
      'Selector',
      'Switch',
      'TextArea',
      'TextInput',
    ].map((type) => expect.objectContaining({ type, package: '@lowdefy/blocks-native' }))
  );
});

test('the form page renders, takes input and validates', async () => {
  const { onScreenOptions } = await renderFormPage();
  expect(await screen.findByText('Customer', { exact: false })).toBeTruthy();
  expect(onScreenOptions).toHaveBeenCalledWith(expect.objectContaining({ title: 'New order' }));
  ['customer', 'email', 'notes', 'quantity', 'colour', 'urgent', 'due', 'lines', 'submit'].forEach(
    (blockId) => {
      expect(screen.getByTestId(blockId)).toBeTruthy();
    }
  );
  expect(screen.getByTestId('email_input').props.keyboardType).toBe('email-address');
  expect(screen.getByText('Bolts')).toBeTruthy();
  expect(screen.getByText('12 packs')).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText('Submit'));
  });
  expect(screen.getByTestId('customer_feedback')).toBeTruthy();
  expect(screen.getByTestId('colour_feedback')).toBeTruthy();

  await act(async () => {
    fireEvent.changeText(screen.getByTestId('customer_input'), 'Acme');
  });
  await act(async () => {
    fireEvent(screen.getByTestId('colour_input'), 'valueChange', 1);
  });
  expect(screen.queryByTestId('customer_feedback')).toBeNull();
  expect(screen.queryByTestId('colour_feedback')).toBeNull();

  await act(async () => {
    fireEvent.press(screen.getByTestId('lines_0_onDelete', { includeHiddenElements: true }));
  });
  expect(screen.queryByText('Bolts')).toBeNull();
  expect(screen.getByText('Nuts')).toBeTruthy();
});
