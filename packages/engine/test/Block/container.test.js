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
  const { textA, textB } = context._internal.RootBlocks.map;
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
  const { container, text, swtch1, swtch2 } = context._internal.RootBlocks.map;
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
  const { container1, text, swtch1, swtch2 } = context._internal.RootBlocks.map;
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
  expect(context._internal.RootBlocks.map.container.eval.visible).toBe(null);
  expect(context._internal.RootBlocks.map.text.eval.visible).toBe(true);
});
