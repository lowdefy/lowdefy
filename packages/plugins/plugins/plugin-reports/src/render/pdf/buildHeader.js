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

import { PAGE_MARGINS } from '../geometry.js';
import { MUTED } from './styles.js';

function buildHeader(headerText) {
  if (!headerText) return undefined;
  return () => ({
    text: headerText,
    margin: [PAGE_MARGINS[0], 24, PAGE_MARGINS[2], 0],
    fontSize: 9,
    color: MUTED,
  });
}

export default buildHeader;
