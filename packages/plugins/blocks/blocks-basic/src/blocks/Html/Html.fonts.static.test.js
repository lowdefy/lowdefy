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

// Font registration happens once per process and is cached, so a failed
// registration has to be tested from a clean module registry — hence its own
// file rather than another case in Html.mock.static.test.js, whose tests run in
// sequence against that same process-wide state.

import { jest } from '@jest/globals';

const renderSvg = jest.fn(async () => '<svg width="200" height="40"></svg>');
const registerFont = jest.fn(async () => []);

class Renderer {
  renderSvg(...args) {
    return renderSvg(...args);
  }
  registerFont(...args) {
    return registerFont(...args);
  }
}

jest.unstable_mockModule('@takumi-rs/core', () => ({ Renderer }));

const { Html } = await import('./Html.static.js');

const fonts = {
  regular: Buffer.from('regular'),
  bold: Buffer.from('bold'),
  italic: Buffer.from('italic'),
  boldItalic: Buffer.from('boldItalic'),
};

function run({ blockId = 'tile_1', logger } = {}) {
  return Html.toReport({
    block: { id: blockId, blockId, type: 'Html', properties: { html: '<div>a</div>' } },
    layout: { width: 200 },
    context: { fonts, ...(logger ? { logger } : {}) },
  });
}

test('a failed font registration is retried by the next block, not cached', async () => {
  // Caching the rejection would hand it to every later block in every later
  // report: one transient failure would skip every Html block a process renders.
  registerFont.mockRejectedValueOnce(new Error('font engine unavailable'));
  const warn = jest.fn();

  const first = await run({ logger: { warn } });
  expect(first).toBeNull();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][1]).toContain('font engine unavailable');
  expect(registerFont).toHaveBeenCalledTimes(4);

  // The next block registers again rather than awaiting the failed promise, and
  // with the engine healthy it renders.
  registerFont.mockClear();
  const second = await run({ blockId: 'tile_2' });
  expect(registerFont).toHaveBeenCalledTimes(4);
  expect(second).toMatchObject({ kind: 'svg', width: 200 });
});
