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

import describeStep from './lint/describeStep.js';

// The line for a journey a headless run cannot take, naming the first step that needs a
// browser: `BROWSER-ONLY  saves an item  step 3 (expect: { text }): expect "text" reads ...`, or
// `on open` when opening the page needed it.
function formatBrowserOnly({ result }) {
  const { index, phase, reason, step } = result.browserOnly;
  const where = phase === 'open' ? 'on open' : describeStep({ step, index });
  return `BROWSER-ONLY  ${result.name}  ${where}: ${reason}`;
}

export default formatBrowserOnly;
