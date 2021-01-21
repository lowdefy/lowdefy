/* eslint-disable dot-notation */

/*
   Copyright 2020-2021 Lowdefy, Inc

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

import { serializer } from '@lowdefy/helpers';
import { WebParser } from '@lowdefy/operators';

import Blocks from '../../src/Blocks';
import State from '../../src/State';

import testContext from '../testContext';

const pageId = 'one';
const rootContext = {};

test('set block to init', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { textInput: 'init' },
  });
  const { textInput } = context.RootBlocks.map;

  expect(textInput.value).toEqual('init');
  expect(context.state).toEqual({ textInput: 'init' });
});

// can't use testContext
test('Blocks to init with no blocks passed', () => {
  const context = {
    pageId,
    state: { a: 'a' },
    update: jest.fn(),
    updateBlock: jest.fn(),
  };
  context.State = new State(context);
  context.parser = new WebParser({ context, contexts: {} });
  context.RootBlocks = new Blocks({
    context,
    arrayIndices: [],
  });
  context.RootBlocks.init();
  context.RootBlocks.update();
  expect(context.state).toEqual({ a: 'a' });
});

// can't use testContext
test('Blocks to init with arrayIndices not an array', () => {
  const context = {
    pageId,
    state: { textInput: 'a' },
    update: jest.fn(),
    updateBlock: jest.fn(),
  };
  context.State = new State(context);
  context.parser = new WebParser({ context, contexts: {} });
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  context.RootBlocks = new Blocks({
    areas: { content: { blocks: [rootBlock] } },
    context,
    arrayIndices: 1,
  });
  context.RootBlocks.init();
  context.RootBlocks.update();
  const { textInput } = context.RootBlocks.map;
  expect(textInput.value).toEqual('a');
  expect(context.state).toEqual({ textInput: 'a' });
});

// can't use testContext
test('Blocks to init with undefined arrayIndices', () => {
  const context = {
    pageId,
    state: { textInput: 'a' },
    update: jest.fn(),
    updateBlock: jest.fn(),
  };
  context.State = new State(context);
  context.parser = new WebParser({ context, contexts: {} });
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  context.RootBlocks = new Blocks({
    areas: { content: { blocks: [rootBlock] } },
    context,
  });
  context.RootBlocks.init();
  context.RootBlocks.update();
  const { textInput } = context.RootBlocks.map;
  expect(textInput.value).toEqual('a');
  expect(context.state).toEqual({ textInput: 'a' });
});

test('set block enforceType value no init', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'MultipleSelector',
            blockId: 'selector',
            meta: {
              category: 'input',
              valueType: 'array',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { selector } = context.RootBlocks.map;
  expect(selector.value).toEqual([]);
  expect(context.state).toEqual({ selector: [] });
});

test('Reset to change blocks back to initState', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { b: 'b' },
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.value).toEqual(null);
  expect(context.state).toEqual({ b: 'b', textInput: null });
  textInput.setValue('new');
  expect(textInput.value).toEqual('new');
  expect(context.state).toEqual({ textInput: 'new', b: 'b' });
  // Reset action sequence
  context.State.resetState();
  context.RootBlocks.reset(serializer.deserializeFromString(context.State.frozenState));
  context.update();
  // ----
  expect(textInput.value).toEqual(null);
  expect(context.state).toEqual({ textInput: null, b: 'b' });
});

test('state should not have value if block is not visible', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            visible: false,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { textInput } = context.RootBlocks.map;
  expect(textInput.value).toBe(null);
  expect(context.state).toEqual({});
});

test('block should only not be visible when visible === false', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'a',
            visible: false,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'b',
            visible: true,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'c',
            visible: 0,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'd',
            visible: 1,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'e',
            visible: 42,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'f',
            visible: '',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'g',
            visible: 'hello',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'h',
            visible: [],
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'i',
            visible: ['a'],
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'j',
            visible: {},
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'k',
            visible: { k: 'k' },
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'l',
            visible: null,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'm',
            visible: undefined,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'n',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: {
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

test('block should only not be evaluated when visible === false', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'a',
            visible: false,
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
            blockId: 'b',
            visible: true,
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
            blockId: 'c',
            visible: 0,
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
            blockId: 'd',
            visible: 1,
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
            blockId: 'e',
            visible: 42,
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
            blockId: 'f',
            visible: '',
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
            blockId: 'g',
            visible: 'hello',
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
            blockId: 'h',
            visible: [],
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
            blockId: 'i',
            visible: ['a'],
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
            blockId: 'j',
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
            blockId: 'k',
            visible: { k: 'k' },
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
            blockId: 'l',
            visible: null,
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
            blockId: 'm',
            visible: undefined,
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
            blockId: 'n',
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
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: {
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
  });
  expect(context.RootBlocks.map.a.eval.properties).toEqual();
  expect(context.RootBlocks.map.b.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.c.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.d.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.e.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.f.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.g.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.h.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.i.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.j.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.k.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.l.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.m.eval.properties).toEqual({ title: 'test' });
  expect(context.RootBlocks.map.n.eval.properties).toEqual({ title: 'test' });
});

test('set value from block', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'SwitchInput',
            blockId: 'swtch',
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { swtch } = context.RootBlocks.map;

  expect(swtch.value).toBe(false);
  expect(context.state).toEqual({ swtch: false });
  expect(swtch.setValue).toBeDefined();
  swtch.setValue(true);
  expect(swtch.value).toBe(true);
  expect(context.state).toEqual({ swtch: true });
});

test('set value from block in nested object', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'a.b.c',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const block = context.RootBlocks.map['a.b.c'];

  expect(block.value).toBe(null);
  expect(context.state).toEqual({ a: { b: { c: null } } });
  expect(block.setValue).toBeDefined();
  block.setValue('Hello');
  expect(block.value).toBe('Hello');
  expect(context.state).toEqual({ a: { b: { c: 'Hello' } } });
});

test('set value from block with type enforceType', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { textInput: 'a' },
  });
  const { textInput } = context.RootBlocks.map;
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

test('parse visible operator with setValue', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textA',
            visible: true,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'textB',
            visible: { '_mql.test': { on: { _state: true }, test: { textA: 'show b' } } },
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { textA: 'show b', textB: 'b' },
  });
  const { textA } = context.RootBlocks.map;

  expect(textA.value).toBe('show b');
  expect(context.state).toEqual({ textA: 'show b', textB: 'b' });
  textA.setValue('hide b');
  expect(textA.value).toBe('hide b');
  expect(context.state).toEqual({ textA: 'hide b' });
});

test('rec parse visible operator with setValue', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textA',
            visible: true,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'textB',
            visible: { '_mql.test': { on: { _state: true }, test: { textA: 'show b' } } },
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'textC',
            visible: { '_mql.test': { on: { _state: true }, test: { textB: { $exists: true } } } },
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { textB: 'b', textA: 'a', textC: 'c' },
  });
  const { textA } = context.RootBlocks.map;
  expect(textA.value).toBe('a');
  expect(context.state).toEqual({ textA: 'a' });
  textA.setValue('show b');
  expect(textA.value).toBe('show b');
  expect(context.state).toEqual({ textA: 'show b', textB: 'b', textC: 'c' });
});

test('non-input blocks visibility toggle', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'Button',
            blockId: 'button',
            visible: { _state: 'swtch' },
            meta: {
              category: 'display',
            },
          },
          {
            type: 'Switch',
            blockId: 'swtch',
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { swtch: true },
  });
  expect(context.state).toEqual({ swtch: true });
  const { button, swtch } = context.RootBlocks.map;
  expect(button.visibleEval.output).toEqual(true);
  swtch.setValue(false);
  expect(context.state).toEqual({ swtch: false });
  expect(button.visibleEval.output).toEqual(false);
  swtch.setValue(true);
  expect(context.state).toEqual({ swtch: true });
  expect(button.visibleEval.output).toEqual(true);
});

test('non-input blocks visibility toggle in array', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'List',
            blockId: 'list',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'Button',
                    blockId: 'list.$.button',
                    visible: { _state: 'list.$.swtch' },
                    meta: {
                      category: 'display',
                    },
                  },
                  {
                    type: 'Switch',
                    blockId: 'list.$.swtch',
                    meta: {
                      category: 'input',
                      valueType: 'boolean',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { list: [{ swtch: true }, { swtch: false }] },
  });
  expect(context.state).toEqual({ list: [{ swtch: true }, { swtch: false }] });

  const button0 = context.RootBlocks.map['list.0.button'];
  const button1 = context.RootBlocks.map['list.1.button'];
  const swtch1 = context.RootBlocks.map['list.1.swtch'];

  expect(button0.visibleEval.output).toEqual(true);
  expect(button1.visibleEval.output).toEqual(false);
  swtch1.setValue(true);
  expect(context.state).toEqual({ list: [{ swtch: true }, { swtch: true }] });
  expect(button1.visibleEval.output).toEqual(true);
  swtch1.setValue(false);
  expect(context.state).toEqual({ list: [{ swtch: true }, { swtch: false }] });
  expect(button1.visibleEval.output).toEqual(false);
});

test('no need to evaluate invisible blocks', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'Button',
            blockId: 'button',
            visible: { _state: 'swtch' },
            meta: {
              category: 'display',
            },
            properties: {
              field: { _state: 'swtch' },
            },
          },
          {
            type: 'Switch',
            blockId: 'swtch',
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { swtch: true },
  });
  expect(context.state).toEqual({ swtch: true });
  const { button, swtch } = context.RootBlocks.map;
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

// TODO: Check again
test('max recuse limit', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'a',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            visible: { '_mql.test': { on: { _state: true }, test: { a: { $ne: 'a' } } } },
          },
          {
            type: 'TextInput',
            blockId: 'c',
            visible: true,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'd',
            visible: { '_mql.test': { on: { _state: true }, test: { c: 'show d' } } },
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'e',
            visible: { '_mql.test': { on: { _state: true }, test: { d: { $exists: true } } } },
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { a: 'a', d: 'd', e: 'e' },
  });
  const { a, c } = context.RootBlocks.map;

  expect(context.state).toEqual({ c: null });
  expect(a.visibleEval.output).toEqual(false); // false due to 20 rec cycles

  c.setValue('show d');
  expect(c.value).toBe('show d');
  expect(context.state).toEqual({ a: 'a', c: 'show d', d: 'd', e: 'e' });
});
