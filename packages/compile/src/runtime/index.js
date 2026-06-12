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

// The runtime support library emitted modules import as `_r`. Each helper
// preserves a walker contract — see the per-file comments.
import buildOperator from './buildOperator.js';
import createScope from './createScope.js';
import { evaluateClosures } from './evaluateClosures.js';
import getVar from './getVar.js';
import { mark, markDeep } from './mark.js';
import { moduleId, moduleVar, bindModuleEntry } from './moduleHelpers.js';
import {
  ref,
  dynRef,
  delegatedRef,
  missingRef,
  moduleComponentRef,
  moduleMenuRef,
} from './applyRef.js';
import synthKey from './synthKey.js';
import tag from './tag.js';

const runtime = {
  buildOperator,
  delegatedRef,
  dynRef,
  getVar,
  mark,
  markDeep,
  missingRef,
  moduleComponentRef,
  moduleId,
  moduleMenuRef,
  moduleVar,
  ref,
  tag,
};

export { runtime, createScope, bindModuleEntry, evaluateClosures, synthKey };
