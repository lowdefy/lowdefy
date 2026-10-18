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
import * as operators from '@lowdefy/operators-js/operators/client';
import { Screen } from '@lowdefy/client-native';

import Box from './blocks/Box.js';

// The plugin maps the shell renders pages with. They hold the packages in shellPlugins.json, from
// which scripts/createTypeManifest.mjs writes the type manifest pages are checked against; a test
// keeps the two the same. The DOM-bound actions get native bodies under the same names later.
const types = {
  actions: { ...actions },
  blocks: { Box, Screen },
  operators: { ...operators },
};

export default types;
