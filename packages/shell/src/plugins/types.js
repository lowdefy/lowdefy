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

import * as actions from '@lowdefy/actions-core/actions';
import * as blocks from '@lowdefy/blocks-native/blocks';
import * as deviceActions from '@lowdefy/blocks-native/actions';
import * as changeCaseOperators from '@lowdefy/operators-change-case/operators/client';
import * as cronOperators from '@lowdefy/operators-cron/operators/client';
import * as dayjsOperators from '@lowdefy/operators-dayjs/operators/client';
import * as diffOperators from '@lowdefy/operators-diff/operators/client';
import * as jsOperators from '@lowdefy/operators-js/operators/client';
import * as jsonataOperators from '@lowdefy/operators-jsonata/operators/client';
import * as mqlOperators from '@lowdefy/operators-mql/operators/client';
import * as nunjucksOperators from '@lowdefy/operators-nunjucks/operators/client';
import * as uuidOperators from '@lowdefy/operators-uuid/operators/client';
import * as yamlOperators from '@lowdefy/operators-yaml/operators/client';
import { Screen } from '@lowdefy/client-native';

import nativeActions from '../actions/nativeActions.js';
import appTypes from './appTypes.js';

// The plugin maps the shell renders pages with. They hold the packages in shellPlugins.json and the
// native types of the app's shell plugins (appTypes.js, from shell.json `plugins`), from which
// scripts/createTypeManifest.mjs writes the type manifest pages are checked against
// (typeManifest.js); a test keeps the two the same. The blocks are the whole native block set,
// with the Screen page type from the native renderer (blocks-native carries only its meta). The
// actions-core actions that reach the DOM on the web run native bodies under the same names, and
// blocks-native's native-only actions (Haptic, Share, PickFile, ...) reach the phone through the
// device the shell installs (src/device). The client operators are those of every default operator package,
// as the build's mobile type map allows. icons is the icon data the native Icon renderer draws
// from (client-native installs it as components.Icon over this map): each page carries the data
// of its own icons (_icons) and PageScreen adds them here before the page renders.
const types = {
  actions: { ...actions, ...deviceActions, ...nativeActions, ...appTypes.actions },
  blocks: { ...blocks, Screen, ...appTypes.blocks },
  icons: {},
  operators: {
    ...jsOperators,
    ...changeCaseOperators,
    ...cronOperators,
    ...dayjsOperators,
    ...diffOperators,
    ...jsonataOperators,
    ...mqlOperators,
    ...nunjucksOperators,
    ...uuidOperators,
    ...yamlOperators,
  },
};

export default types;
