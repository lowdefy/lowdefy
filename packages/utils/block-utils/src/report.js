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

// Helpers shared by the block packages' static report renderers
// (`[Block].static.js`). They are exported from their own entry so a server that
// loads a renderer registry never imports the React components on the main
// entry. Renderers emit plain report-IR object literals; these helpers keep the
// cell shape and the blank/text/size coercions in one place.

import cell from './report/cell.js';
import htmlToText from './report/htmlToText.js';
import isBlank from './report/isBlank.js';
import styleValue from './report/styleValue.js';
import toCellValue from './report/toCellValue.js';
import toPoints from './report/toPoints.js';

export { cell, htmlToText, isBlank, styleValue, toCellValue, toPoints };
