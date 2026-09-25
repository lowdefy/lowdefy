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

import dataEventEnhancer from './dataEventEnhancer.js';
import iconEnhancer from './iconEnhancer.js';
import linkEnhancer from './linkEnhancer.js';
import popoverEnhancer from './popoverEnhancer.js';
import toneEnhancer from './toneEnhancer.js';
import tooltipEnhancer from './tooltipEnhancer.js';

// The HTML attribute vocabulary, in the order the pass runs. popover comes first
// so it captures popover content before anything else changes it.
const HTML_ENHANCERS = [
  popoverEnhancer,
  tooltipEnhancer,
  dataEventEnhancer,
  iconEnhancer,
  linkEnhancer,
  toneEnhancer,
];

export default HTML_ENHANCERS;
