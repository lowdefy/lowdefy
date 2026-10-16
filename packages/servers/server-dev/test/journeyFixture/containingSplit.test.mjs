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

import { fixtureTest, postJourney } from './fixtureClient.mjs';

// A containing target matches the text a person reads, even when the markup
// splits it across elements. Run by the real runner over the fixture app's
// containing_split page.

const variants = [
  { blockId: 'md_bold', name: 'Jane' },
  { blockId: 'html_bold', name: 'Joan' },
  { blockId: 'html_bare', name: 'Jill' },
  { blockId: 'html_newline', name: 'June' },
  { blockId: 'html_nbsp', name: 'Jack' },
  { blockId: 'html_flex', name: 'Jude' },
  { blockId: 'html_input', name: 'Jim' },
];

async function run(steps) {
  const result = await postJourney({ pageId: 'containing_split', timeout: 3000, steps });
  return result.failure;
}

describe.each(variants)('$blockId', ({ blockId, name }) => {
  const containing = `Assigned to ${name}`;
  fixtureTest('expect page-wide', async () => {
    expect(await run([{ expect: { visible: { containing } } }])).toBeUndefined();
  });
  fixtureTest('expect in block', async () => {
    expect(await run([{ expect: { visible: { blockId, containing } } }])).toBeUndefined();
  });
  fixtureTest('click page-wide', async () => {
    expect(await run([{ click: { containing } }])).toBeUndefined();
  });
  fixtureTest('click in block', async () => {
    expect(await run([{ click: { blockId, containing } }])).toBeUndefined();
  });
});
