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
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { CallMethod, SetState, Validate, Wait } from '@lowdefy/actions-core/actions';
import { LowdefyPage } from '@lowdefy/client-native';
import {
  _event,
  _if,
  _index,
  _not,
  _state,
  _string,
  _sum,
  _type,
} from '@lowdefy/operators-js/operators/client';

import * as blocks from '../blocks.js';
import buildPage from './buildPage.js';
import createFakeHost from './createFakeHost.js';
import icons from './icons.json';
import theme from './theme.json';

// Each event's runs, as `{ name, event }`, so a test sees what a block triggered and with what.
function createRecord() {
  const calls = [];
  const Record = ({ params }) => {
    calls.push(params);
  };
  return { calls, Record };
}

/**
 * Renders a page of native blocks as a shell does: through @lowdefy/client-native's LowdefyPage,
 * with the computed theme tokens of an app with colorPrimary #6366f1, the test icons (which
 * client-native's icon renderer draws as components.Icon), and the CallMethod, SetState,
 * Validate, Wait and Record actions.
 *
 * @param {Object} params
 * @param {Object} params.pageConfig The page as config writes it (blocks, events, properties).
 *   buildPage builds it; its root is usually a Box.
 * @param {Object} [params.actions] Extra test actions, by type name, over the default ones.
 * @param {'light'|'dark'} [params.darkMode] The theme mode, light unless asked.
 * @param {Object} [params.rootConfig] Root config keys over the test root config.
 * @returns {Promise<{ calls: Object[], host: Object, lowdefy: Object }>} The Record action's
 *   params in the order they ran, the fake host and the lowdefy object.
 */
async function renderPage({
  actions = {},
  darkMode = 'light',
  pageConfig,
  rootConfig: rootOverrides = {},
}) {
  const { calls, Record } = createRecord();
  const host = createFakeHost({ path: `/${pageConfig.id}` });
  const lowdefy = { buildId: 'build-1' };
  await render(
    <LowdefyPage
      core={{
        apiBase: 'https://app.lowdefy.test',
        auth: { authConfig: {} },
        basePath: '',
        lowdefy,
      }}
      host={host}
      pageConfig={buildPage(pageConfig)}
      rootConfig={{
        classMap: {},
        home: { configured: true, pageId: pageConfig.id },
        lowdefyApp: { slug: 'test-app' },
        menus: [],
        pagePaths: { [pageConfig.id]: pageConfig.id },
        theme: { ...theme, darkMode },
        ...rootOverrides,
      }}
      types={{
        actions: { CallMethod, Record, SetState, Validate, Wait, ...actions },
        blocks,
        icons,
        operators: { _event, _if, _index, _not, _state, _string, _sum, _type },
      }}
    />
  );
  return { calls, host, lowdefy };
}

// A page of one Box holding the blocks under test.
function page(blocksConfig, rest = {}) {
  return { id: 'home', type: 'Box', blocks: blocksConfig, ...rest };
}

// The actions that record an event's run under `name`, with the event the block passed.
function record(name) {
  return [{ id: `record_${name}`, type: 'Record', params: { name, event: { _event: true } } }];
}

function styleOf(element) {
  return StyleSheet.flatten(element.props.style) ?? {};
}

// The host elements of a type under `element`, depth first: react-native-svg draws an icon as
// RNSVGSvgView, RNSVGGroup and RNSVGPath (or RNSVGCircle, ...) host elements.
function findAllOfType(element, typeName) {
  const found = [];
  (element.children ?? []).forEach((child) => {
    if (typeof child === 'string') return;
    if (child.type === typeName) found.push(child);
    found.push(...findAllOfType(child, typeName));
  });
  return found;
}

// The `d` of each path an icon draws.
function iconPaths(element) {
  return findAllOfType(element, 'RNSVGPath').map((path) => path.props.d);
}

async function press(element) {
  await act(async () => {
    fireEvent.press(element);
  });
}

export { findAllOfType, iconPaths, icons, page, press, record, renderPage, screen, styleOf, theme };
