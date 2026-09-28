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

import claimDomEvent from './claimDomEvent.js';
import runOutsideDomEvent from './runOutsideDomEvent.js';

function dispatch(domEvent, fn) {
  global.window = { event: domEvent };
  try {
    return fn();
  } finally {
    delete global.window;
  }
}

test('claimDomEvent lets the first block with actions handle a DOM event', () => {
  dispatch(new Event('click'), () => {
    expect(claimDomEvent({ blockId: 'button', bubble: false, hasActions: true })).toBeNull();
    expect(claimDomEvent({ blockId: 'card', bubble: false, hasActions: true })).toBe('button');
  });
});

test('claimDomEvent never claims for events fired while an action runs', () => {
  dispatch(new Event('click'), () => {
    expect(claimDomEvent({ blockId: 'button', bubble: false, hasActions: true })).toBeNull();
    const handledBy = runOutsideDomEvent(() =>
      claimDomEvent({ blockId: 'table', bubble: false, hasActions: true })
    );
    expect(handledBy).toBeNull();
    // Outside the action the claim still holds for the blocks around the button.
    expect(claimDomEvent({ blockId: 'card', bubble: false, hasActions: true })).toBe('button');
  });
});

test('claimDomEvent never claims scheduler messages', () => {
  dispatch(new MessageEvent('message'), () => {
    expect(claimDomEvent({ blockId: 'a', bubble: false, hasActions: true })).toBeNull();
    expect(claimDomEvent({ blockId: 'b', bubble: false, hasActions: true })).toBeNull();
  });
});

test('claimDomEvent never skips an internal event for a DOM event another block handled', () => {
  dispatch(new Event('click'), () => {
    expect(claimDomEvent({ blockId: 'button', bubble: false, hasActions: true })).toBeNull();
    expect(
      claimDomEvent({ blockId: 'table', bubble: false, hasActions: true, internal: true })
    ).toBeNull();
    expect(claimDomEvent({ blockId: 'card', bubble: false, hasActions: true })).toBe('button');
  });
});
