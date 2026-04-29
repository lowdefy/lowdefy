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

import testContext from '../testContext.js';

const pageId = 'one';
const lowdefy = { pageId };

test('container and set value from block', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { textB: 'b' },
        },
      ],
    },
    blocks: [
      {
        type: 'Box',
        id: 'container1',
        blocks: [
          {
            type: 'TextInput',
            id: 'textA',
          },
        ],
      },
      {
        type: 'Box',
        id: 'container2',
        blocks: [
          {
            type: 'TextInput',
            id: 'textB',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textA, textB } = context._internal.RootSlots.map;
  expect(textA.value).toBe(null);
  expect(textA.setValue).toBeDefined();
  expect(textB.value).toBe('b');
  expect(textB.setValue).toBeDefined();
  expect(context.state).toEqual({ textA: null, textB: 'b' });
  textA.setValue('Hello');
  expect(textA.value).toBe('Hello');
  expect(context.state).toEqual({ textA: 'Hello', textB: 'b' });
});

test('container blocks visibility toggle fields in state and propagate visibility to children', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { text: 'a', swtch1: true, swtch2: true },
        },
      ],
    },
    blocks: [
      {
        type: 'Box',
        id: 'container',
        visible: { _state: 'swtch2' },
        blocks: [
          {
            type: 'TextInput',
            id: 'text',
            visible: { _state: 'swtch1' },
          },
        ],
      },
      {
        type: 'Switch',
        id: 'swtch1',
      },
      {
        type: 'Switch',
        id: 'swtch2',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { container, text, swtch1, swtch2 } = context._internal.RootSlots.map;
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  swtch1.setValue(false);
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(false);
  expect(context.state).toEqual({ swtch1: false, swtch2: true });
  swtch1.setValue(true);
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });
  swtch2.setValue(false);
  expect(container.visibleEval.output).toEqual(false);
  expect(text.visibleEval.output).toEqual(false);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  swtch2.setValue(true);
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });
});

test('container blocks visibility toggle fields in state with nested containers and propagate visibility to children', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { text: 'a', swtch1: true, swtch2: true },
        },
      ],
    },
    blocks: [
      {
        type: 'Box',
        id: 'container1',
        visible: { _state: 'swtch2' },
        blocks: [
          {
            type: 'Box',
            id: 'container2',
            blocks: [
              {
                type: 'TextInput',
                id: 'text',
                visible: { _state: 'swtch1' },
              },
            ],
          },
        ],
      },
      {
        type: 'Switch',
        id: 'swtch1',
      },
      {
        type: 'Switch',
        id: 'swtch2',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { container1, text, swtch1, swtch2 } = context._internal.RootSlots.map;
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });

  expect(container1.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  swtch1.setValue(false);
  expect(container1.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(false);
  expect(context.state).toEqual({ swtch1: false, swtch2: true });
  swtch1.setValue(true);
  expect(container1.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });
  swtch2.setValue(false);
  expect(container1.visibleEval.output).toEqual(false);
  expect(text.visibleEval.output).toEqual(false);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  swtch2.setValue(true);
  expect(container1.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });
});

test('SetState on a hidden block preserves the value when the block becomes visible', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { show: false, myInput: 'new' },
        },
      ],
    },
    blocks: [
      {
        type: 'Box',
        id: 'container',
        visible: { _state: 'show' },
        blocks: [
          {
            type: 'TextInput',
            id: 'myInput',
          },
        ],
      },
      {
        type: 'Button',
        id: 'reveal',
        events: {
          onClick: [{ id: 'a', type: 'SetState', params: { show: true } }],
        },
      },
      {
        type: 'Button',
        id: 'hide',
        events: {
          onClick: [{ id: 'a', type: 'SetState', params: { show: false } }],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { container, myInput, reveal, hide } = context._internal.RootSlots.map;

  // After init: container hidden, value held in memory but not in state.
  expect(container.visibleEval.output).toEqual(false);
  expect(myInput.visibleEval.output).toEqual(false);
  expect(myInput.value).toEqual('new');
  expect(context.state).toEqual({ show: false });

  // Reveal: input becomes visible and value is republished to state.
  await reveal.triggerEvent({ name: 'onClick' });
  expect(container.visibleEval.output).toEqual(true);
  expect(myInput.visibleEval.output).toEqual(true);
  expect(myInput.value).toEqual('new');
  expect(context.state).toEqual({ show: true, myInput: 'new' });

  // Hide again: state field deleted, but value stays in memory.
  await hide.triggerEvent({ name: 'onClick' });
  expect(myInput.visibleEval.output).toEqual(false);
  expect(myInput.value).toEqual('new');
  expect(context.state).toEqual({ show: false });

  // Reveal a second time: value restored to state.
  await reveal.triggerEvent({ name: 'onClick' });
  expect(myInput.visibleEval.output).toEqual(true);
  expect(myInput.value).toEqual('new');
  expect(context.state).toEqual({ show: true, myInput: 'new' });
});

test('revealing a hidden block triggers re-eval of other blocks referencing its state', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { show: false, myInput: 'new' },
        },
      ],
    },
    blocks: [
      {
        type: 'Box',
        id: 'container',
        visible: { _state: 'show' },
        blocks: [
          {
            type: 'TextInput',
            id: 'myInput',
          },
        ],
      },
      {
        type: 'Paragraph',
        id: 'mirror',
        properties: { content: { _state: 'myInput' } },
        visible: { _eq: [{ _state: 'myInput' }, 'new'] },
      },
      {
        type: 'Button',
        id: 'reveal',
        events: {
          onClick: [{ id: 'a', type: 'SetState', params: { show: true } }],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { myInput, mirror, reveal } = context._internal.RootSlots.map;

  // Hidden block: in-memory value held, not in state.
  expect(myInput.value).toEqual('new');
  expect(context.state).toEqual({ show: false });

  // While myInput is hidden, _state lookups return undefined for it. The mirror
  // block's visibility (which depends on _state.myInput === 'new') should be
  // false, and its title property should reflect the missing state.
  expect(mirror.visibleEval.output).toEqual(false);

  // Reveal: the hidden input becomes visible, its value is published to state,
  // and the engine's repeat loop must rerun recEval so that mirror picks up the
  // new state value through its _state operators.
  await reveal.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ show: true, myInput: 'new' });
  expect(mirror.visibleEval.output).toEqual(true);
  expect(mirror.propertiesEval.output).toEqual({ content: 'new' });
});

test('SetState-driven visibility toggle preserves input state (parity with setValue)', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { text: 'a', swtch1: true, swtch2: true },
        },
      ],
    },
    blocks: [
      {
        type: 'Box',
        id: 'container',
        visible: { _state: 'swtch2' },
        blocks: [
          {
            type: 'TextInput',
            id: 'text',
            visible: { _state: 'swtch1' },
          },
        ],
      },
      {
        type: 'Button',
        id: 'set1false',
        events: {
          onClick: [{ id: 'a', type: 'SetState', params: { swtch1: false } }],
        },
      },
      {
        type: 'Button',
        id: 'set1true',
        events: {
          onClick: [{ id: 'a', type: 'SetState', params: { swtch1: true } }],
        },
      },
      {
        type: 'Button',
        id: 'set2false',
        events: {
          onClick: [{ id: 'a', type: 'SetState', params: { swtch2: false } }],
        },
      },
      {
        type: 'Button',
        id: 'set2true',
        events: {
          onClick: [{ id: 'a', type: 'SetState', params: { swtch2: true } }],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { container, text, set1false, set1true, set2false, set2true } =
    context._internal.RootSlots.map;
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });

  await set1false.triggerEvent({ name: 'onClick' });
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(false);
  expect(context.state).toEqual({ swtch1: false, swtch2: true });

  await set1true.triggerEvent({ name: 'onClick' });
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });

  await set2false.triggerEvent({ name: 'onClick' });
  expect(container.visibleEval.output).toEqual(false);
  expect(text.visibleEval.output).toEqual(false);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });

  await set2true.triggerEvent({ name: 'onClick' });
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });
});

test('visibleParent. If container visible is null, child blocks should still be evaluated', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'container',
        type: 'Box',
        visible: {
          _state: 'notThere', // will evaluate to null
        },
        blocks: [
          {
            type: 'TextInput',
            id: 'text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context._internal.RootSlots.map.container.eval.visible).toBe(null);
  expect(context._internal.RootSlots.map.text.eval.visible).toBe(true);
});
