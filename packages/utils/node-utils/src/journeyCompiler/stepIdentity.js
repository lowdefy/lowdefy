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

import { type } from '@lowdefy/helpers';

import { getStepKey } from '../journeyGrammar/validateJourneySteps.js';
import normaliseBlockId from '../journeyGrammar/normaliseBlockId.js';

function readTarget(params) {
  if (type.isString(params)) return { blockId: params };
  if (type.isObject(params)) return params;
  return {};
}

// What a step does, without the data it did it to: the verb, the block (list
// indices normalised), the grid column, and for a click the control's text,
// since "Assign" and "Delete" in the same grid row are different actions. The
// row, `nth` and every typed or picked value are left out. A press has no
// target, so its chord is what tells Enter from Escape. A hand-written `open`
// clicks its target's trigger, which is what a recording holds for it, so it
// reads as a click on that target.
//
// With `isConfigText`, a click's text enters the identity only when it is the
// app's config text, and any other text reads as no text: production clicks
// hold config text or none, so a journey click on a data row or on a label
// built from values matches them by block and column, and no reader confirms
// a production value that is not already in the repository. Without it the
// text is read as written.
function readClickText({ target, isConfigText }) {
  if (!type.isString(target.text)) return null;
  if (!type.isUndefined(isConfigText) && !isConfigText(target.text)) return null;
  return target.text;
}

function stepIdentity({ step, isConfigText }) {
  const stepKey = getStepKey(step);
  const params = step[stepKey];
  const verb = stepKey === 'open' ? 'click' : stepKey;
  if (verb === 'press') {
    return JSON.stringify([verb, params]);
  }
  if (verb === 'back') {
    return JSON.stringify([verb]);
  }
  const target = readTarget(params);
  const blockId = type.isString(target.blockId) ? normaliseBlockId(target.blockId) : null;
  const column = type.isString(target.column) ? target.column : null;
  const text = verb === 'click' ? readClickText({ target, isConfigText }) : null;
  return JSON.stringify([verb, blockId, column, text]);
}

export default stepIdentity;
