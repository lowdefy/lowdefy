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

import dropAction from './dropAction.js';
import dropBlock from './dropBlock.js';
import dropPayload from './dropPayload.js';
import dropStep from './dropStep.js';
import flipVisible from './flipVisible.js';
import retargetLink from './retargetLink.js';
import skipValidate from './skipValidate.js';
import swapIf from './swapIf.js';

const operators = {
  [dropAction.name]: dropAction,
  [skipValidate.name]: skipValidate,
  [flipVisible.name]: flipVisible,
  [swapIf.name]: swapIf,
  [dropPayload.name]: dropPayload,
  [retargetLink.name]: retargetLink,
  [dropBlock.name]: dropBlock,
  [dropStep.name]: dropStep,
};

export default operators;
