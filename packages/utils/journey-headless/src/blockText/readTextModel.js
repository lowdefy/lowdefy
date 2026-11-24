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

import checkHeadlessText from '@lowdefy/block-utils/checkHeadlessText.js';
import { get, type } from '@lowdefy/helpers';

import REDRAWN_BLOCKS from '../standIns/REDRAWN_BLOCKS.js';
import BLOCK_TEXT_MODELS from './BLOCK_TEXT_MODELS.js';

// A value a plugin block draws from a property its meta names in headlessText: a string as text
// when it holds no markup, else read both as html and as text, since the meta does not say which
// the component draws, so it never passes a check on its own; a number as
// text; none as nothing. A boolean, an object or an array is drawn in a way the meta does not
// say.
function readDeclared(value) {
  if (type.isNone(value) || value === '') return { pieces: [], open: null };
  if (type.isNumber(value)) return { pieces: [{ text: String(value) }], open: null };
  if (type.isString(value)) {
    return /[<&]/.test(value)
      ? { pieces: [{ either: value }], open: null }
      : { pieces: [{ text: value }], open: null };
  }
  return { pieces: [], open: 'a property its headlessText names holds a value that is not text' };
}

// The text model of a block (findTextModel), except that a block a CallMethod has called a method
// on that its meta declares null in headlessMethods (REDRAWN_BLOCKS) draws text its properties do
// not say: its own text is open, with the method named.
function readTextModel({ block, blockMetas }) {
  const model = findTextModel({ block, blockMetas });
  if (model === null || !REDRAWN_BLOCKS.has(block)) {
    return model;
  }
  const method = REDRAWN_BLOCKS.get(block);
  return function redrawnTextModel(args) {
    return {
      ...model(args),
      pieces: [],
      open: `its method "${method}" changed what it draws, which a headless run does not follow`,
    };
  };
}

// The text model of a block (BLOCK_TEXT_MODELS), or for a block type the headless run does not
// know, the one its meta declares (headlessText: the paths of the properties it draws as text, in
// order), else null. A declared model draws no area the headless run knows of (areas: null), so a
// block inside it leaves its text open.
function findTextModel({ block, blockMetas }) {
  if (Object.hasOwn(BLOCK_TEXT_MODELS, block.type)) {
    return BLOCK_TEXT_MODELS[block.type];
  }
  const headlessText = blockMetas[block.type]?.headlessText;
  checkHeadlessText({ blockType: block.type, headlessText });
  if (type.isNone(headlessText)) {
    return null;
  }
  return function declaredTextModel({ properties }) {
    const read = headlessText.map((path) => readDeclared(get(properties, path)));
    return {
      pieces: read.flatMap(({ pieces }) => pieces),
      areas: null,
      open: read.find(({ open }) => open !== null)?.open ?? null,
    };
  };
}

export default readTextModel;
