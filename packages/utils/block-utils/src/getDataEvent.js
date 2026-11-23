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

import { journeyTargetSelectors } from '@lowdefy/helpers';

// dataset keys are camelCase (data-record-id → recordId); config authors
// write the attributes in kebab-case, so hand them back as snake_case.
function toSnakeCase(key) {
  return key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

function toDatasetKey(attribute) {
  return attribute
    .replace(/^data-/, '')
    .replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

// The journey control marks ClickableHtml writes on its data-event elements
// (markDataEventControls) are the runner's, not the author's data.
const CONTROL_MARK_KEYS = new Set(
  Object.values(journeyTargetSelectors.controlAttributes).map(toDatasetKey)
);

// A data-event element names the block event it fires; its other data-*
// attributes are the event object.
function getDataEvent(element) {
  const { event: name, ...data } = element.dataset;
  const event = {};
  Object.keys(data).forEach((key) => {
    if (CONTROL_MARK_KEYS.has(key)) return;
    event[toSnakeCase(key)] = data[key];
  });
  return { name, event };
}

export default getDataEvent;
