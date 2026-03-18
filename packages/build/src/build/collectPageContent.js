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

function walkValue(value, strings) {
  if (typeof value === 'string') {
    strings.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      walkValue(item, strings);
    }
    return;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) {
      walkValue(v, strings);
    }
  }
}

function walkBlockProperties(blocks, strings) {
  if (!Array.isArray(blocks)) return;
  for (const block of blocks) {
    if (block.class) {
      walkValue(block.class, strings);
    }
    if (block.properties) {
      walkValue(block.properties, strings);
    }
    walkBlockProperties(block.blocks, strings);
    for (const area of Object.values(block.areas ?? {})) {
      walkBlockProperties(area.blocks, strings);
    }
    for (const slot of Object.values(block.slots ?? {})) {
      walkBlockProperties(slot.blocks, strings);
    }
  }
}

function collectPageContent(pages) {
  const strings = [];
  walkBlockProperties(pages, strings);
  return strings.join('\n');
}

export default collectPageContent;
export { walkBlockProperties };
