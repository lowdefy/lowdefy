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
import { render } from '@testing-library/react-native';
import { CallMethod, SetState, Validate, Wait } from '@lowdefy/actions-core/actions';
import { LowdefyPage } from '@lowdefy/client-native';
import {
  _event,
  _if,
  _index,
  _not,
  _state,
  _sum,
  _type,
} from '@lowdefy/operators-js/operators/client';

import * as blocks from '../blocks.js';
import buildPage from './buildPage.js';
import createFakeHost from './createFakeHost.js';
import { Box, Paragraph } from './testBlocks.js';
import theme from './theme.json';

const rootConfig = {
  classMap: {},
  home: { configured: true, pageId: 'form' },
  lowdefyApp: { slug: 'test-app' },
  menus: [],
  pagePaths: { form: 'form' },
  theme,
};

/**
 * Renders a page of native blocks with the real renderer and engine.
 *
 * @param {Object} params
 * @param {Object} params.pageConfig The page as config writes it (buildPage builds it). Its root
 *   is a Box.
 * @param {Object} [params.actions] Extra test actions, by type name.
 * @param {Object} [params.rootConfig] Root config keys over the test root config.
 */
async function renderPage({ actions = {}, pageConfig, rootConfig: rootOverrides = {} }) {
  const { host } = createFakeHost({ path: `/${pageConfig.id}` });
  const lowdefy = { buildId: 'build-1' };
  const types = {
    actions: { CallMethod, SetState, Validate, Wait, ...actions },
    blocks: { ...blocks, Box, Paragraph },
    operators: { _event, _if, _index, _not, _state, _sum, _type },
  };
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
      rootConfig={{ ...rootConfig, ...rootOverrides }}
      types={types}
    />
  );
  return { host, lowdefy };
}

export default renderPage;
