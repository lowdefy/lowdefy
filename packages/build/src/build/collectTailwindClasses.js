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

function collectFromValue(value, classes) {
  if (typeof value === 'string') {
    classes.add(value);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string') {
        classes.add(item);
      }
    }
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) {
      collectFromValue(v, classes);
    }
  }
}

function walkBlocks(blocks, classes) {
  for (const block of blocks ?? []) {
    if (block.class !== undefined) {
      collectFromValue(block.class, classes);
    }
    walkBlocks(block.blocks, classes);
    for (const area of Object.values(block.areas ?? {})) {
      walkBlocks(area.blocks, classes);
    }
    for (const slot of Object.values(block.slots ?? {})) {
      walkBlocks(slot.blocks, classes);
    }
  }
}

function collectTailwindClasses({ components }) {
  const classes = new Set();
  walkBlocks(components.pages, classes);
  return classes;
}

export default collectTailwindClasses;
export { walkBlocks };
