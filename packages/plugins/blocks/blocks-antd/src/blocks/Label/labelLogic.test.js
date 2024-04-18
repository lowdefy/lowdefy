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

import labelLogic from './labelLogic.js';

const makeCssClass = jest.fn();
const makeCssClassImp = (style, op) => JSON.stringify({ style, options: op });

beforeEach(() => {
  makeCssClass.mockReset();
  makeCssClass.mockImplementation(makeCssClassImp);
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

const defaultInput = {
  blockId: 'label_1',
  content: {},
  methods: { makeCssClass },
  properties: {
    title: 'Test title',
  },
  validation: {
    status: null,
    warnings: [],
    errors: [],
  },
};

test('label default label', () => {
  let res = labelLogic({ properties: { title: '' }, content: {}, methods: { makeCssClass } });
  expect(res.label).toEqual(null);
  res = labelLogic({
    properties: { title: 'a', disabled: true },
    content: {},
    methods: { makeCssClass },
  });
  expect(res.label).toEqual(false);
  res = labelLogic({ blockId: 'blockId', content: {}, methods: { makeCssClass } });
  expect(res.label).toEqual('blockId');
  res = labelLogic({ content: { label: () => 'content.label' }, methods: { makeCssClass } });
  expect(res.label).toEqual('content.label');
});

test('label default label', () => {
  let res = labelLogic({
    properties: { extra: null },
    validation: { status: null },
    content: {},
    methods: { makeCssClass },
  });
  expect(res.showExtra).toEqual(false);
  res = labelLogic({
    properties: { extra: null },
    validation: { status: 'success' },
    content: {},
    methods: { makeCssClass },
  });
  expect(res.showExtra).toEqual(false);
  res = labelLogic({
    properties: { extra: null },
    validation: { status: 'error' },
    content: {},
    methods: { makeCssClass },
  });
  expect(res.showExtra).toEqual(false);
  res = labelLogic({
    properties: { extra: 'a' },
    validation: { status: null },
    content: {},
    methods: { makeCssClass },
  });
  expect(res.showExtra).toEqual(true);
  res = labelLogic({
    properties: { extra: 'a' },
    validation: { status: 'success' },
    content: {},
    methods: { makeCssClass },
  });
  expect(res.showExtra).toEqual(true);
  res = labelLogic({
    properties: { extra: 'a' },
    validation: { status: 'error' },
    content: {},
    methods: { makeCssClass },
  });
  expect(res.showExtra).toEqual(false);
});

test('label default label', () => {
  let res = labelLogic({
    validation: { status: 'error' },
    content: {},
    methods: { makeCssClass },
  });
  expect(res.showFeedback).toEqual(true);
  res = labelLogic({
    validation: { status: 'warning' },
    content: {},
    methods: { makeCssClass },
  });
  expect(res.showFeedback).toEqual(true);
  res = labelLogic({
    validation: { status: 'success' },
    content: {},
    methods: { makeCssClass },
  });
  expect(res.showExtra).toEqual(false);
  res = labelLogic({
    validation: { status: null },
    content: {},
    methods: { makeCssClass },
  });
  expect(res.showExtra).toEqual(false);
});

test('label default', () => {
  expect(labelLogic({ blockId: 'label_1', content: {}, methods: { makeCssClass } }))
    .toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic title undefined', () => {
  expect(labelLogic({ ...defaultInput, properties: { title: undefined } })).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic with required', () => {
  expect(labelLogic({ ...defaultInput, properties: { required: true } })).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic with validation.status = error', () => {
  expect(
    labelLogic({
      ...defaultInput,
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Test title",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});
test('label default logic with validation.status = warning', () => {
  expect(
    labelLogic({
      ...defaultInput,
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Test title",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic with validation.status = success', () => {
  expect(
    labelLogic({
      ...defaultInput,
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Test title",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic with required', () => {
  expect(
    labelLogic({
      ...defaultInput,
      required: true,
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Test title",
      "labelClassName": "ant-form-item-required {\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      required: true,
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Test title",
      "labelClassName": "ant-form-item-required {\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      required: true,
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Test title",
      "labelClassName": "ant-form-item-required {\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      required: true,
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Test title",
      "labelClassName": "ant-form-item-required {\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic properties.align = right', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: { align: 'right' },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { align: 'right' },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { align: 'right' },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { align: 'right' },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic properties.align = left', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: { align: 'left' },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { align: 'left' },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { align: 'left' },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { align: 'left' },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic properties.inline = true', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: { inline: true },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "flex": "0 1 auto",
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"overflow\\":\\"inherit\\",\\"whiteSpace\\":false,\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"flexWrap\\":\\"inherit\\",\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "flex": "1 1 auto",
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { inline: true },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "flex": "0 1 auto",
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"overflow\\":\\"inherit\\",\\"whiteSpace\\":false,\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"flexWrap\\":\\"inherit\\",\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "flex": "1 1 auto",
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { inline: true },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "flex": "0 1 auto",
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"overflow\\":\\"inherit\\",\\"whiteSpace\\":false,\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"flexWrap\\":\\"inherit\\",\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "flex": "1 1 auto",
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { inline: true },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "flex": "0 1 auto",
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"overflow\\":\\"inherit\\",\\"whiteSpace\\":false,\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"flexWrap\\":\\"inherit\\",\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "flex": "1 1 auto",
      },
    }
  `);
});

test('label default logic properties.colon = true', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: { colon: true },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { colon: true },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { colon: true },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { colon: true },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic properties.title = title_1', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: { title: 'title_1' },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "title_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { title: 'title_1' },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "title_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { title: 'title_1' },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "title_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { title: 'title_1' },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "title_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic properties.title = long', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        title:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod',
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        title:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod',
      },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        title:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod',
      },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        title:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod',
      },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic properties.title = long and properties.inline = true', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        inline: true,
        title:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod',
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "flex": "0 1 auto",
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"overflow\\":\\"inherit\\",\\"whiteSpace\\":false,\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"flexWrap\\":\\"inherit\\",\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "flex": "1 1 auto",
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        inline: true,
        title:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod',
      },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "flex": "0 1 auto",
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"overflow\\":\\"inherit\\",\\"whiteSpace\\":false,\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"flexWrap\\":\\"inherit\\",\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "flex": "1 1 auto",
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        inline: true,
        title:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod',
      },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "flex": "0 1 auto",
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"overflow\\":\\"inherit\\",\\"whiteSpace\\":false,\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"flexWrap\\":\\"inherit\\",\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "flex": "1 1 auto",
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        inline: true,
        title:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod',
      },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commod",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "flex": "0 1 auto",
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"overflow\\":\\"inherit\\",\\"whiteSpace\\":false,\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"flexWrap\\":\\"inherit\\",\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "flex": "1 1 auto",
      },
    }
  `);
});

test('label default logic properties.size = small', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: { size: 'small' },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":-4},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":-4},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":24},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":0}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { size: 'small' },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":-4},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":-4},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":24},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":0}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { size: 'small' },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":-4},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":-4},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":24},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":0}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { size: 'small' },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":-4},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":-4},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":24},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":0}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic properties.size = large', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: { size: 'large' },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":40},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { size: 'large' },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":40},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { size: 'large' },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":40},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { size: 'large' },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":40},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic properties.disabled = true', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: { disabled: true },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": false,
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { disabled: true },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": false,
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { disabled: true },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": false,
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: { disabled: true },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": false,
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic properties.style', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        style: {
          border: '1px solid yellow',
        },
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},{\\"border\\":\\"1px solid yellow\\"}]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        style: {
          border: '1px solid yellow',
        },
      },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},{\\"border\\":\\"1px solid yellow\\"}]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        style: {
          border: '1px solid yellow',
        },
      },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},{\\"border\\":\\"1px solid yellow\\"}]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        style: {
          border: '1px solid yellow',
        },
      },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},{\\"border\\":\\"1px solid yellow\\"}]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic properties.extraStyle', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        extraStyle: {
          border: '1px solid yellow',
        },
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},{\\"border\\":\\"1px solid yellow\\"}]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        extraStyle: {
          border: '1px solid yellow',
        },
      },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},{\\"border\\":\\"1px solid yellow\\"}]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        extraStyle: {
          border: '1px solid yellow',
        },
      },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},{\\"border\\":\\"1px solid yellow\\"}]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        extraStyle: {
          border: '1px solid yellow',
        },
      },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},{\\"border\\":\\"1px solid yellow\\"}]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic properties.feedbackStyle', () => {
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        feedbackStyle: {
          border: '1px solid yellow',
        },
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},{\\"border\\":\\"1px solid yellow\\"}]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        feedbackStyle: {
          border: '1px solid yellow',
        },
      },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},{\\"border\\":\\"1px solid yellow\\"}]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        feedbackStyle: {
          border: '1px solid yellow',
        },
      },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},{\\"border\\":\\"1px solid yellow\\"}]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      properties: {
        feedbackStyle: {
          border: '1px solid yellow',
        },
      },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},{\\"border\\":\\"1px solid yellow\\"}]}",
      "label": "label_1",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});

test('label default logic content.content = () => one', () => {
  expect(
    labelLogic({
      ...defaultInput,
      content: { content: () => 'one' },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Test title",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      content: { content: () => 'one' },
      validation: {
        status: 'error',
        errors: ['an error'],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-error {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Test title",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-error {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      content: { content: () => 'one' },
      validation: {
        status: 'warning',
        errors: [],
        warnings: ['an warning'],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-warning {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Test title",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-warning {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": true,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
  expect(
    labelLogic({
      ...defaultInput,
      content: { content: () => 'one' },
      validation: {
        status: 'success',
        errors: [],
        warnings: [],
      },
    })
  ).toMatchInlineSnapshot(`
    Object {
      "extraClassName": "ant-form-item-explain ant-form-item-extra {\\"style\\":[{\\"marginTop\\":0},null]}",
      "feedbackClassName": "ant-form-item-explain ant-form-item-extra ant-form-item-explain-feedback ant-form-item-explain-success {\\"style\\":[{\\"marginTop\\":0},null]}",
      "label": "Test title",
      "labelClassName": "{\\"style\\":[{\\"height\\":\\"fit-content !important\\",\\"minHeight\\":32},null]}",
      "labelCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
      "labelColClassName": "ant-form-item-label ant-form-item-label-left {\\"style\\":{\\"whiteSpace\\":\\"normal\\",\\"marginBottom\\":8}}",
      "rowClassName": "ant-form-item ant-form-item-has-feedback ant-form-item-has-success {\\"style\\":{\\"marginBottom\\":0}}",
      "showExtra": false,
      "showFeedback": false,
      "wrapperCol": Object {
        "sm": Object {
          "span": 24,
        },
        "xs": Object {
          "span": 24,
        },
      },
    }
  `);
});
