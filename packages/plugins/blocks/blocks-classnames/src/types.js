/*
  Copyright 2020-2024 Lowdefy, Inc

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

import * as blocks from './blocks.js';

// Get metadata from blocks
const icons = {};
const styles = {};

Object.keys(blocks).forEach((block) => {
  // Skip internal exports that aren't actual blocks
  if (block.startsWith('wrapped')) return;
  
  if (blocks[block].meta) {
    icons[block] = blocks[block].meta.icons || [];
    styles[block] = blocks[block].meta.styles || [];
  } else {
    icons[block] = [];
    styles[block] = [];
  }
});

export default {
  blocks: Object.keys(blocks).filter(name => !name.startsWith('wrapped')),
  icons,
  styles: { default: [], ...styles },
};