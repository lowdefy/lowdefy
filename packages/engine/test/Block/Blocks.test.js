/* eslint-disable dot-notation */

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
import { jest } from '@jest/globals';

import { serializer } from '@lowdefy/helpers';

import testContext from '../testContext.js';

const pageId = 'one';
const lowdefy = { pageId, _internal: {} };

test('init blocks and SetState to set value to block', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { textInput: 'init' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;

  expect(context.state).toEqual({ textInput: 'init' });
  expect(textInput.value).toEqual('init');
});

test('Blocks to init with no blocks passed', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context._internal.RootBlocks.context.pageId).toEqual('root');
});

test('set block enforceType value no init', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'MultipleSelector',
        id: 'selector',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { selector } = context._internal.RootBlocks.map;
  expect(selector.value).toEqual([]);
  expect(context.state).toEqual({ selector: [] });
});

test('set block value to initValue in meta', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'ObjectBlock',
        id: 'object_one',
      },
    ],
  };
  lowdefy._internal.blocks = {
    ObjectBlock: {
      meta: {
        category: 'input',
        valueType: 'object',
        initValue: {
          a: 1,
        },
      },
    },
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { object_one } = context._internal.RootBlocks.map;
  expect(object_one.value).toEqual({ a: 1 });
  expect(context.state).toEqual({ object_one: { a: 1 } });
});

test('Reset to change blocks back to initState', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { b: 'b' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.value).toEqual(null);
  expect(context.state).toEqual({ b: 'b', textInput: null });
  textInput.setValue('new');
  expect(textInput.value).toEqual('new');
  expect(context.state).toEqual({ textInput: 'new', b: 'b' });
  // Reset action sequence
  context._internal.State.resetState();
  context._internal.RootBlocks.reset(
    serializer.deserializeFromString(context._internal.State.frozenState)
  );
  context._internal.update();
  // ----
  expect(textInput.value).toEqual(null);
  expect(context.state).toEqual({ textInput: null, b: 'b' });
});

test('state should not have value if block is not visible', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            id: 'textInput',
            visible: false,
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.value).toBe(null);
  expect(context.state).toEqual({});
});

test('block should only not be visible when visible === false', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: {
            a: 'a',
            b: 'b',
            c: 'c',
            d: 'd',
            e: 'e',
            f: 'f',
            g: 'g',
            h: 'h',
            i: 'i',
            j: 'j',
            k: 'k',
            l: 'l',
            m: 'm',
            n: 'n',
          },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'a',
        visible: false,
      },
      {
        type: 'TextInput',
        id: 'b',
        visible: true,
      },
      {
        type: 'TextInput',
        id: 'c',
        visible: 0,
      },
      {
        type: 'TextInput',
        id: 'd',
        visible: 1,
      },
      {
        type: 'TextInput',
        id: 'e',
        visible: 42,
      },
      {
        type: 'TextInput',
        id: 'f',
        visible: '',
      },
      {
        type: 'TextInput',
        id: 'g',
        visible: 'hello',
      },
      {
        type: 'TextInput',
        id: 'h',
        visible: [],
      },
      {
        type: 'TextInput',
        id: 'i',
        visible: ['a'],
      },
      {
        type: 'TextInput',
        id: 'j',
        visible: {},
      },
      {
        type: 'TextInput',
        id: 'k',
        visible: { k: 'k' },
      },
      {
        type: 'TextInput',
        id: 'l',
        visible: null,
      },
      {
        type: 'TextInput',
        id: 'm',
        visible: undefined,
      },
      {
        type: 'TextInput',
        id: 'n',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
    f: 'f',
    g: 'g',
    h: 'h',
    i: 'i',
    j: 'j',
    k: 'k',
    l: 'l',
    m: 'm',
    n: 'n',
  });
});

test('block should only not be evaluated when visible === false', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: {
            title: 'test',
            a: 'a',
            b: 'b',
            c: 'c',
            d: 'd',
            e: 'e',
            f: 'f',
            g: 'g',
            h: 'h',
            i: 'i',
            j: 'j',
            k: 'k',
            l: 'l',
            m: 'm',
            n: 'n',
          },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'a',
        visible: false,
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'b',
        visible: true,
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'c',
        visible: 0,
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'd',
        visible: 1,
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'e',
        visible: 42,
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'f',
        visible: '',
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'g',
        visible: 'hello',
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'h',
        visible: [],
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'i',
        visible: ['a'],
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'j',
        visible: {},
        properties: {
          title: {
            _state: 'title',
          },
        },
        meta: {
          category: 'input',
          valueType: 'string',
        },
      },
      {
        type: 'TextInput',
        id: 'k',
        visible: { k: 'k' },
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'l',
        visible: null,
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'm',
        visible: undefined,
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
      {
        type: 'TextInput',
        id: 'n',
        properties: {
          title: {
            _state: 'title',
          },
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context._internal.RootBlocks.map.a.eval.properties).toEqual();
  expect(context._internal.RootBlocks.map.b.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.c.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.d.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.e.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.f.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.g.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.h.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.i.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.j.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.k.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.l.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.m.eval.properties).toEqual({ title: 'test' });
  expect(context._internal.RootBlocks.map.n.eval.properties).toEqual({ title: 'test' });
});

test('set value from block', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'Switch',
        id: 'swtch',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { swtch } = context._internal.RootBlocks.map;

  expect(swtch.value).toBe(false);
  expect(context.state).toEqual({ swtch: false });
  expect(swtch.setValue).toBeDefined();
  swtch.setValue(true);
  expect(swtch.value).toBe(true);
  expect(context.state).toEqual({ swtch: true });
});

test('set value from block in nested object', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'TextInput',
        id: 'a.b.c',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const block = context._internal.RootBlocks.map['a.b.c'];

  expect(block.value).toBe(null);
  expect(context.state).toEqual({ a: { b: { c: null } } });
  expect(block.setValue).toBeDefined();
  block.setValue('Hello');
  expect(block.value).toBe('Hello');
  expect(context.state).toEqual({ a: { b: { c: 'Hello' } } });
});

test('set value from block with type enforceType', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { textInput: 'a' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textInput',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textInput } = context._internal.RootBlocks.map;
  expect(textInput.value).toBe('a');
  expect(context.state).toEqual({ textInput: 'a' });
  expect(textInput.setValue).toBeDefined();
  textInput.setValue(1);
  expect(textInput.value).toBe(null);
  expect(context.state).toEqual({ textInput: null });
  textInput.setValue('b');
  expect(textInput.value).toBe('b');
  expect(context.state).toEqual({ textInput: 'b' });
  textInput.setValue('');
  expect(textInput.value).toBe(null);
  expect(context.state).toEqual({ textInput: null });
});

test('parse visible operator with setValue', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { textA: 'show b', textB: 'b' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textA',
        visible: true,
      },
      {
        type: 'TextInput',
        id: 'textB',
        visible: { _eq: [{ _state: 'textA' }, 'show b'] },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textA } = context._internal.RootBlocks.map;

  expect(textA.value).toBe('show b');
  expect(context.state).toEqual({ textA: 'show b', textB: 'b' });
  textA.setValue('hide b');
  expect(textA.value).toBe('hide b');
  expect(context.state).toEqual({ textA: 'hide b' });
});

test('rec parse visible operator with setValue', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { textB: 'b', textA: 'a', textC: 'c' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'textA',
        visible: true,
      },
      {
        type: 'TextInput',
        id: 'textB',
        visible: { _eq: [{ _state: 'textA' }, 'show b'] },
      },
      {
        type: 'TextInput',
        id: 'textC',
        visible: { _eq: [{ _state: 'textB' }, 'b'] },
        // visible: { '_mql.test': { on: { _state: true }, test: { textB: { $exists: true } } } },s
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { textA, textB, textC } = context._internal.RootBlocks.map;
  expect(textA.value).toBe('a');
  expect(textB.eval.visible).toBe(false);
  expect(textC.eval.visible).toBe(false);
  expect(context.state).toEqual({ textA: 'a' });
  textA.setValue('show b');
  expect(textA.value).toBe('show b');
  expect(textB.value).toBe('b');
  expect(textC.value).toBe('c');
  expect(textB.eval.visible).toBe(true);
  expect(textC.eval.visible).toBe(true);
  expect(context.state).toEqual({ textA: 'show b', textB: 'b', textC: 'c' });
});

test('non-input blocks visibility toggle', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { swtch: true },
        },
      ],
    },
    blocks: [
      {
        type: 'Button',
        id: 'button',
        visible: { _state: 'swtch' },
      },
      {
        type: 'Switch',
        id: 'swtch',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ swtch: true });
  const { button, swtch } = context._internal.RootBlocks.map;
  expect(button.visibleEval.output).toEqual(true);
  swtch.setValue(false);
  expect(context.state).toEqual({ swtch: false });
  expect(button.visibleEval.output).toEqual(false);
  swtch.setValue(true);
  expect(context.state).toEqual({ swtch: true });
  expect(button.visibleEval.output).toEqual(true);
});

test('non-input blocks visibility toggle in array', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { list: [{ swtch: true }, { swtch: false }] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'Button',
            id: 'list.$.button',
            visible: { _state: 'list.$.swtch' },
          },
          {
            type: 'Switch',
            id: 'list.$.swtch',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: [{ swtch: true }, { swtch: false }] });

  const button0 = context._internal.RootBlocks.map['list.0.button'];
  const button1 = context._internal.RootBlocks.map['list.1.button'];
  const swtch1 = context._internal.RootBlocks.map['list.1.swtch'];

  expect(button0.visibleEval.output).toEqual(true);
  expect(button1.visibleEval.output).toEqual(false);
  swtch1.setValue(true);
  expect(context.state).toEqual({ list: [{ swtch: true }, { swtch: true }] });
  expect(button1.visibleEval.output).toEqual(true);
  swtch1.setValue(false);
  expect(context.state).toEqual({ list: [{ swtch: true }, { swtch: false }] });
  expect(button1.visibleEval.output).toEqual(false);
});

test('no need to evaluate invisible blocks', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { swtch: true },
        },
      ],
    },
    blocks: [
      {
        type: 'Button',
        id: 'button',
        visible: { _state: 'swtch' },
        properties: {
          field: { _state: 'swtch' },
        },
      },
      {
        type: 'Switch',
        id: 'swtch',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ swtch: true });
  const { button, swtch } = context._internal.RootBlocks.map;
  expect(button.visibleEval.output).toEqual(true);
  expect(button.propertiesEval.output.field).toEqual(true);
  swtch.setValue(false);
  expect(context.state).toEqual({ swtch: false });
  expect(button.visibleEval.output).toEqual(false);
  expect(button.propertiesEval.output.field).toEqual(true);
  swtch.setValue(true);
  expect(context.state).toEqual({ swtch: true });
  expect(button.visibleEval.output).toEqual(true);
  expect(button.propertiesEval.output.field).toEqual(true);
});

test('max recuse limit', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: { a: 'a', d: 'd', e: 'e' },
        },
      ],
    },
    blocks: [
      {
        type: 'TextInput',
        id: 'a',
        visible: { _ne: [{ _state: 'a' }, 'a'] },
      },
      {
        type: 'TextInput',
        id: 'c',
        visible: true,
      },
      {
        type: 'TextInput',
        id: 'd',
        visible: { _eq: [{ _state: 'c' }, 'show d'] },
      },
      {
        type: 'TextInput',
        id: 'e',
        visible: { '_mql.test': { on: { _state: true }, test: { d: { $exists: true } } } },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { c } = context._internal.RootBlocks.map;

  let count = 0;

  const updateStateFromRoot = context._internal.RootBlocks.updateStateFromRoot;

  context._internal.RootBlocks.updateStateFromRoot = () => {
    count += 1;
    updateStateFromRoot();
  };

  c.setValue('show d');
  expect(count).toEqual(21);
});
