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

import { jest } from '@jest/globals';

import evaluateStaticOperators from './evaluateStaticOperators.js';

const mockContext = {
  typesMap: {
    blocks: {
      Button: {},
      TextInput: {},
      Card: {},
      Paragraph: {},
    },
    requests: {
      AxiosHttp: {},
    },
    actions: {
      SetState: {},
    },
  },
  logger: {
    warn: jest.fn(),
  },
  errors: [],
  keyMap: {},
};

beforeEach(() => {
  mockContext.logger.warn.mockClear();
  mockContext.errors = [];
});

describe('evaluateStaticOperators', () => {
  test('evaluates static _sum operator', () => {
    const input = {
      result: { _sum: [1, 2, 3, 4, 5] },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.result).toBe(15);
  });

  test('evaluates static _if operator with true condition', () => {
    const input = {
      result: { _if: { test: true, then: 'yes', else: 'no' } },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.result).toBe('yes');
  });

  test('evaluates static _if operator with false condition', () => {
    const input = {
      result: { _if: { test: false, then: 'yes', else: 'no' } },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.result).toBe('no');
  });

  test('evaluates nested static operators', () => {
    const input = {
      result: {
        _if: {
          test: { _eq: [{ _sum: [2, 3] }, 5] },
          then: 'correct',
          else: 'wrong',
        },
      },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.result).toBe('correct');
  });

  test('evaluates _string.concat operator', () => {
    const input = {
      result: { '_string.concat': ['Hello', ' ', 'World'] },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.result).toBe('Hello World');
  });

  test('evaluates _math.abs operator', () => {
    const input = {
      result: { '_math.abs': -42 },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.result).toBe(42);
  });

  test('preserves dynamic _state operator (not evaluated)', () => {
    const input = {
      result: { _state: 'someField' },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    // _state is dynamic, should be preserved
    expect(output.result).toEqual({ _state: 'someField' });
  });

  test('preserves dynamic _user operator (not evaluated)', () => {
    const input = {
      result: { _user: 'sub' },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.result).toEqual({ _user: 'sub' });
  });

  test('preserves static operator with dynamic params', () => {
    const input = {
      result: {
        _sum: [5, { _state: 'value' }],
      },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    // _sum has dynamic params, entire expression preserved
    expect(output.result).toEqual({
      _sum: [5, { _state: 'value' }],
    });
  });

  test('preserves _if with dynamic test', () => {
    const input = {
      result: {
        _if: {
          test: { _gt: [{ _state: 'count' }, 10] },
          then: 'high',
          else: 'low',
        },
      },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    // Contains dynamic _state, preserved
    expect(output.result._if).toBeDefined();
    expect(output.result._if.test._gt[0]).toEqual({ _state: 'count' });
  });

  test('type boundary prevents dynamic bubble-up to siblings', () => {
    const input = {
      blocks: [
        {
          type: 'Button',
          properties: {
            label: { _state: 'buttonLabel' },
          },
        },
        {
          type: 'Paragraph',
          properties: {
            content: { '_string.concat': ['Sum: ', { _sum: [1, 2, 3] }] },
          },
        },
      ],
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    // First block has dynamic content
    expect(output.blocks[0].properties.label).toEqual({ _state: 'buttonLabel' });
    // Second block should have static operator evaluated
    expect(output.blocks[1].properties.content).toBe('Sum: 6');
  });

  test('evaluates static parts while preserving dynamic parts', () => {
    const input = {
      blocks: [
        {
          type: 'Card',
          properties: {
            title: { '_string.concat': ['Total: ', { _sum: [10, 20, 30] }] },
          },
        },
      ],
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.blocks[0].properties.title).toBe('Total: 60');
  });

  test('handles empty input', () => {
    const output = evaluateStaticOperators({
      context: mockContext,
      input: {},
      refDef: { path: 'test.yaml' },
    });
    expect(output).toEqual({});
  });

  test('handles null input', () => {
    const output = evaluateStaticOperators({
      context: mockContext,
      input: null,
      refDef: { path: 'test.yaml' },
    });
    expect(output).toBeNull();
  });

  test('handles undefined typesMap in context', () => {
    const contextWithoutTypesMap = {
      typesMap: undefined,
      logger: { warn: jest.fn() },
    };
    const input = {
      result: { _sum: [1, 2, 3] },
    };
    const output = evaluateStaticOperators({
      context: contextWithoutTypesMap,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.result).toBe(6);
  });

  test('preserves dynamic _math.random method', () => {
    const input = {
      result: { '_math.random': [] },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    // _math.random is dynamic, should be preserved
    expect(output.result).toEqual({ '_math.random': [] });
  });

  test('evaluates static _math methods while preserving dynamic _math.random', () => {
    const input = {
      staticMath: { '_math.abs': -100 },
      dynamicMath: { '_math.random': [] },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.staticMath).toBe(100);
    expect(output.dynamicMath).toEqual({ '_math.random': [] });
  });

  test('complex nested structure with mixed static and dynamic', () => {
    const input = {
      pages: [
        {
          id: 'home',
          type: 'Button',
          blocks: [
            {
              type: 'Card',
              properties: {
                staticValue: { _sum: [100, 200] },
                dynamicValue: { _state: 'cardState' },
              },
            },
          ],
        },
      ],
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.pages[0].blocks[0].properties.staticValue).toBe(300);
    expect(output.pages[0].blocks[0].properties.dynamicValue).toEqual({ _state: 'cardState' });
  });

  test('static operator with invalid params collects error in context.errors', () => {
    const input = {
      result: { _sum: 'not-an-array' },
    };
    const output = evaluateStaticOperators({
      context: mockContext,
      input,
      refDef: { path: 'test.yaml' },
    });
    expect(output.result).toBeNull();
    expect(mockContext.errors).toHaveLength(1);
    expect(mockContext.errors[0].message).toContain('_sum takes an array type as input.');
    expect(mockContext.errors[0].filePath).toBe('test.yaml');
  });
});
