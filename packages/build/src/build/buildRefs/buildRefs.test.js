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

import testContext from '../../test/testContext.js';
import buildRefs from './buildRefs.js';

const mockLogWarn = jest.fn();

const logger = {
  warn: mockLogWarn,
};

const readConfigFileMockImplementation = (files) => {
  const mockImp = (filePath) => {
    const file = files.find((file) => file.path === filePath);
    if (!file) {
      return null;
    }
    return file.content;
  };
  return mockImp;
};

const mockReadConfigFile = jest.fn();

const context = testContext({
  logger,
  readConfigFile: mockReadConfigFile,
});

test('buildRefs no refs', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `field: value`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({ context });
  expect(res).toEqual({
    field: 'value',
  });
});

test('buildRefs', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
jsonFile:
  _ref: jsonFile.json
twoLevels:
  _ref: twoLevels.json
vars:
  _ref:
    path: vars.yaml
    vars:
      var_1: var_1_value
`,
    },
    {
      path: 'jsonFile.json',
      content: `{"file": "jsonFile.json"}`,
    },
    {
      path: 'twoLevels.json',
      content: `{"file": "twoLevels.json", "jsonFile": { "_ref": "jsonFile.json" }}`,
    },
    {
      path: 'vars.yaml',
      content: `
file: vars.yaml
var1:
  _var: var_1
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({ context });
  expect(res).toEqual({
    jsonFile: { file: 'jsonFile.json' },
    twoLevels: { file: 'twoLevels.json', jsonFile: { file: 'jsonFile.json' } },
    vars: { file: 'vars.yaml', var1: 'var_1_value' },
  });
});

test('buildRefs file not found', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
doesNotExist:
  _ref: doesNotExist`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  await expect(buildRefs({ context })).rejects.toThrow(
    'Tried to reference file "doesNotExist" from "lowdefy.yaml", but file does not exist.'
  );
});

test('buildRefs max recursion depth', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
_ref: maxRecursion1.json`,
    },
    {
      path: 'maxRecursion1.json',
      content: `{ "_ref": "maxRecursion2.json" }`,
    },
    {
      path: 'maxRecursion2.json',
      content: `{ "_ref": "maxRecursion1.json" }`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  await expect(buildRefs({ context })).rejects.toThrow();
  await expect(buildRefs({ context })).rejects.toThrow(
    'Maximum recursion depth of references exceeded.'
  );
});

test('load refs to text files', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
text:
  _ref: text.txt
html:
  _ref: html.html
md:
  _ref: markdown.md
`,
    },
    {
      path: 'text.txt',
      content: `Some multiline
text.

Hello.`,
    },
    {
      path: 'html.html',
      content: `<h1>Heading</h1>
<p>Hello there</p>`,
    },
    {
      path: 'markdown.md',
      content: `### Title

Hello there`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({ context });
  expect(res).toEqual({
    html: `<h1>Heading</h1>
<p>Hello there</p>`,
    md: `### Title

Hello there`,
    text: `Some multiline
text.

Hello.`,
  });
});

test('buildRefs null ref definition', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
invalid:
  _ref: null`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  await expect(buildRefs({ context })).rejects.toThrow('Invalid _ref definition');
});

test('buildRefs invalid ref definition', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
invalid:
  _ref: 1`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  await expect(buildRefs({ context })).rejects.toThrow('Invalid _ref definition');
});

test('buildRefs invalid ref definition 2', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
invalid:
  _ref:
    a: b`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  await expect(buildRefs({ context })).rejects.toThrow('Invalid _ref definition');
});

test('buildRefs for file not found', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
invalid:
  _ref: no_file.yaml`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  await expect(buildRefs({ context })).rejects.toThrow(
    'Tried to reference file "no_file.yaml" from "lowdefy.yaml", but file does not exist.'
  );
});

describe('Parse ref content', () => {
  test('buildRefs nunjucks text file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
templated:
  _ref:
    path: template.njk
    vars:
      var_1: There`,
      },
      {
        path: 'template.njk',
        content: 'Hello {{ var_1 }}',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      templated: 'Hello There',
    });
  });

  test('buildRefs nunjucks json file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
templated:
  _ref:
    path: template.json.njk
    vars:
      field: field1`,
      },
      {
        path: 'template.json.njk',
        content: '{ "{{ field }}": true }',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      templated: { field1: true },
    });
  });

  test('buildRefs nunjucks yaml file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
templated:
  _ref:
    path: template.yaml.njk
    vars:
      values:
        - value1
        - value2`,
      },
      {
        path: 'template.yaml.njk',
        content: `list:
{% for value in values %}
  - field: {{ value }}
{% endfor %}
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      templated: { list: [{ field: 'value1' }, { field: 'value2' }] },
    });
  });

  test('buildRefs nunjucks yml file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
templated:
  _ref:
    path: template.yml.njk
    vars:
      values:
        - value1
        - value2`,
      },
      {
        path: 'template.yml.njk',
        content: `list:
{% for value in values %}
  - field: {{ value }}
{% endfor %}
      `,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      templated: { list: [{ field: 'value1' }, { field: 'value2' }] },
    });
  });
});

describe('vars', () => {
  test('buildRefs var specified by field', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
  ref:
    _ref:
      path: file.yaml
      vars:
        var1: value`,
      },
      {
        path: 'file.yaml',
        content: `
  field:
    _var:
      key: var1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      ref: {
        field: 'value',
      },
    });
  });

  test('buildRefs var with default value, but value specified', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
  ref:
    _ref:
      path: file.yaml
      vars:
        var1: value`,
      },
      {
        path: 'file.yaml',
        content: `
  field:
    _var:
      key: var1
      default: default`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      ref: {
        field: 'value',
      },
    });
  });

  test('buildRefs var uses default value if value not specified', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
  ref:
    _ref:
      path: file.yaml
      vars:
        var1: null`,
      },
      {
        path: 'file.yaml',
        content: `
  field1:
    _var:
      key: var1
      default: default
  field2:
    _var:
      key: var2
      default: default`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      ref: {
        field1: null,
        field2: 'default',
      },
    });
  });

  test("buildRefs var default value can be empty string, boolean false or 0, but not NaN nor Inf which aren't JSON serializable", async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
  ref:
    _ref:
      path: file.yaml`,
      },
      {
        path: 'file.yaml',
        content: `
  field_empty_str:
    _var:
      key: var1
      default: ''
  field_false:
    _var:
      key: var2
      default: false
  field_NaN:
    _var:
      key: var3
      default: .nan
  field_Inf:
    _var:
      key: var4
      default: .inf
  field_zero:
    _var:
      key: var5
      default: 0`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      ref: {
        field_empty_str: '',
        field_false: false,
        field_NaN: null,
        field_Inf: null,
        field_zero: 0,
      },
    });
  });

  test('buildRefs _var receives invalid type', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
  ref:
    _ref:
      path: file.yaml
      vars:
        var1: value`,
      },
      {
        path: 'file.yaml',
        content: `
  field:
    _var: [1]`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    await expect(buildRefs({ context })).rejects.toThrow(
      '"_var" operator takes a string or object with "key" field as arguments.'
    );
  });

  test('buildRefs should copy vars', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
  ref:
    _ref:
      path: file.yaml
      vars:
        var1:
          field: value`,
      },
      {
        path: 'file.yaml',
        content: `
  ref1:
    _var: var1
  ref2:
    _var: var1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      ref: {
        ref1: { field: 'value' },
        ref2: { field: 'value' },
      },
    });
    res.ref.ref1.field = 'newValue';
    expect(res).toEqual({
      ref: {
        ref1: { field: 'newValue' },
        ref2: { field: 'value' },
      },
    });
  });
});

describe('Handle nested refs/vars', () => {
  test('buildRefs pass vars two levels', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
ref1:
  _ref:
    path: file1.yaml
    vars:
      var1: Hello`,
      },
      {
        path: 'file1.yaml',
        content: `
ref2:
  _ref:
    path: file2.yaml
    vars:
      var2:
        _var: var1`,
      },
      {
        path: 'file2.yaml',
        content: `
value:
  _var: var2`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      ref1: {
        ref2: {
          value: 'Hello',
        },
      },
    });
  });

  test('buildRefs use a ref in a var', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
ref1:
  _ref:
    path: file1.yaml
    vars:
      file2:
        _ref: file2.md`,
      },
      {
        path: 'file1.yaml',
        content: `
content:
  _var: file2`,
      },
      {
        path: 'file2.md',
        content: 'Hello',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      ref1: {
        content: 'Hello',
      },
    });
  });

  test('buildRefs use a ref in var, with a var from parent as a var', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
ref1:
  _ref:
    path: file1.yaml
    vars:
      parent1: 1
      parent2: 2`,
      },
      {
        path: 'file1.yaml',
        content: `
ref2:
  _ref:
    path: file2.yaml
    vars:
      var:
        _var: parent1
      ref:
        _ref:
          path: file3.yaml
          vars:
            var:
              _var: parent2
            const: 3
`,
      },
      {
        path: 'file2.yaml',
        content: `
value:
  _var: var
ref:
  _var: ref`,
      },
      {
        path: 'file3.yaml',
        content: `
value:
  _var: var
const:
  _var: const`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      ref1: {
        ref2: {
          value: 1,
          ref: {
            value: 2,
            const: 3,
          },
        },
      },
    });
  });

  test('buildRefs _ref path is a var, shorthand path', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
  _ref:
    path: file1.yaml
    vars:
      filePath: file2.md`,
      },
      {
        path: 'file1.yaml',
        content: `
  text:
    _ref:
      _var: filePath`,
      },
      {
        path: 'file2.md',
        content: 'Hello',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      text: 'Hello',
    });
  });

  test('buildRefs _ref path is a var', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
  _ref:
    path: file1.yaml
    vars:
      filePath: file2.md`,
      },
      {
        path: 'file1.yaml',
        content: `
  text:
    _ref:
      path:
        _var: filePath`,
      },
      {
        path: 'file2.md',
        content: 'Hello',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      text: 'Hello',
    });
  });

  test('buildRefs pass vars two levels with a transformer', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
ref1:
  _ref:
    path: file1.yaml
    vars:
      var1: Hello`,
      },
      {
        path: 'file1.yaml',
        content: `
ref2:
  _ref:
    path: file2.yaml
    transformer: src/test/buildRefs/testBuildRefsTransformIdentity.js
    vars:
      var2:
        _var: var1`,
      },
      {
        path: 'file2.yaml',
        content: `a: 1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      ref1: {
        ref2: {
          obj: {
            a: 1,
          },
          vars: {
            var2: 'Hello',
          },
        },
      },
    });
  });
});

describe('get key from referenced file', () => {
  test('buildRefs get key from referenced yaml file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
field:
  _ref:
    path: target.yaml
    key: targetField`,
      },
      {
        path: 'target.yaml',
        content: 'targetField: value',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      field: 'value',
    });
  });

  test('buildRefs get key from referenced json file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
field:
  _ref:
    path: target.json
    key: targetField`,
      },
      {
        path: 'target.json',
        content: '{"targetField": "value"}',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      field: 'value',
    });
  });

  test('buildRefs get key from referenced file returns default null', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
field:
  _ref:
    path: target.yaml
    key: field2`,
      },
      {
        path: 'target.yaml',
        content: 'field1: value',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      field: null,
    });
  });

  test('buildRefs get key from referenced file returns null if file is not a yaml or json file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
field:
  _ref:
    path: target.txt
    key: targetField`,
      },
      {
        path: 'target.txt',
        content: 'targetField: value',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      field: null,
    });
  });

  test('buildRefs get key from chained referenced files', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
field:
  _ref:
    path: target.yaml
    key: targetField`,
      },
      {
        path: 'target.yaml',
        content: '_ref: shared.yaml',
      },
      {
        path: 'shared.yaml',
        content: 'targetField: value',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      field: 'value',
    });
  });

  test('buildRefs get key from referenced file with build operators', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
field:
  _ref:
    path: target.yaml
    key: targetField`,
      },
      {
        path: 'target.yaml',
        content: `
        _build.object.assign:
          - field1: value1
            field2: value2
          - targetField: value
            `,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      field: 'value',
    });
  });

  test('buildRefs get key from chained referenced files with build operators', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
field:
  _ref:
    path: target.yaml
    key: field1`,
      },
      {
        path: 'target.yaml',
        content: `
        _build.object.assign:
          - _ref: defaults.yaml
          - field1: newValue
            field3: value3
            `,
      },
      {
        path: 'defaults.yaml',
        content: `
field1: value1
field2: value2`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      field: 'newValue',
    });
  });
  // This test fails until issue #1488 is fixed
  //   test('buildRefs get key, built using operators, from referenced file', async () => {
  //     const files = [
  //       {
  //         path: 'lowdefy.yaml',
  //         content: `
  // field:
  //   _ref:
  //     path: target.yaml
  //     key:
  //       _build.string.concat:
  //         - target
  //         - Field`,
  //       },
  //       {
  //         path: 'target.yaml',
  //         content: 'targetField: value',
  //       },
  //     ];
  //     mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  //     const res = await buildRefs({ context });
  //     expect( res).toEqual({
  //       field: 'value',
  //     });
  //   });
  test('buildRefs get _var key', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
field:
  _ref:
    path: target.yaml
    vars:
      field: targetField
    `,
      },
      {
        path: 'target.yaml',
        content: `
_ref:
    path: target2.yaml
    key:
      _var: field
    `,
      },
      {
        path: 'target2.yaml',
        content: 'targetField: value',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      field: 'value',
    });
  });
});

describe('transformer functions', () => {
  test('buildRefs with transformer function', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
  _ref:
    path: target.yaml
    transformer: src/test/buildRefs/testBuildRefsTransform.js
    vars:
      var1: var1`,
      },
      {
        path: 'target.yaml',
        content: 'a: 1',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      add: 43,
      json: '{"a":1}',
      var: 'var1',
    });
  });

  test('buildRefs with async transformer function', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  path: target.yaml
  transformer: src/test/buildRefs/testBuildRefsAsyncFunction.js`,
      },
      {
        path: 'target.yaml',
        content: 'a: 1',
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({ async: true });
  });
});

describe('resolver functions', () => {
  test('buildRefs with resolver function, no path or vars', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsResolver.js`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(mockReadConfigFile.mock.calls).toEqual([['lowdefy.yaml']]);
    expect(res).toEqual({
      resolved: true,
      path: null,
      vars: {},
      stage: 'test',
    });
  });

  test('buildRefs with resolver function, path and vars given', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsResolver.js
  path: target
  vars:
    var: var1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(mockReadConfigFile.mock.calls).toEqual([['lowdefy.yaml']]);
    expect(res).toEqual({
      resolved: true,
      path: 'target',
      vars: {
        var: 'var1',
      },
      stage: 'test',
    });
  });

  test('buildRefs with async resolver function', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsAsyncFunction.js`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({ async: true });
  });

  test('buildRefs with resolver function, returned yaml content is parsed', async () => {
    let files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsParsingResolver.js
  path: target.yaml
  vars:
    var: var1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({ array: [1, 2] });
  });

  test('buildRefs with resolver function, returned yml content is parsed', async () => {
    let files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsParsingResolver.js
  path: target.yml
  vars:
    var: var1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({ array: [1, 2] });
  });

  test('buildRefs with resolver function, returned json content is parsed', async () => {
    let files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsParsingResolver.js
  path: target.json
  vars:
    var: var1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({ a: 42 });
  });

  test('buildRefs with resolver function, returned yaml.njk content is parsed', async () => {
    let files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsParsingResolver.js
  path: target.yaml.njk
  vars:
    var: var1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({ a: 'var1' });
  });

  test('buildRefs with resolver function, returned yml.njk content is parsed', async () => {
    let files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsParsingResolver.js
  path: target.yaml.njk
  vars:
    var: var1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({ a: 'var1' });
  });

  test('buildRefs with resolver function, returned json.njk content is parsed', async () => {
    let files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsParsingResolver.js
  path: target.json.njk
  vars:
    var: var1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({ a: 'var1' });
  });

  test('buildRefs with resolver function, resolver throws error', async () => {
    let files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsErrorResolver.js`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    await expect(buildRefs({ context })).rejects.toThrow(
      'Error calling resolver "src/test/buildRefs/testBuildRefsErrorResolver.js" from "lowdefy.yaml": Test error'
    );
  });

  test('buildRefs with resolver function, resolver returns null', async () => {
    let files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsNullResolver.js
  path: "null"`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    await expect(buildRefs({ context })).rejects.toThrow(
      'Tried to reference with resolver "src/test/buildRefs/testBuildRefsNullResolver.js" from "lowdefy.yaml", but received "null".'
    );
  });

  test('buildRefs with resolver function, resolver returns undefined', async () => {
    let files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  resolver: src/test/buildRefs/testBuildRefsNullResolver.js`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    await expect(buildRefs({ context })).rejects.toThrow(
      'Tried to reference with resolver "src/test/buildRefs/testBuildRefsNullResolver.js" from "lowdefy.yaml", but received "undefined".'
    );
  });

  test('buildRefs with default resolver function', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref: target`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({
      context: {
        ...context,
        refResolver: 'src/test/buildRefs/testBuildRefsResolver.js',
      },
    });
    expect(mockReadConfigFile.mock.calls).toEqual([['lowdefy.yaml']]);
    // Return context gets JSON stringified and parsed, so functions are stripped
    expect(res).toEqual({
      resolved: true,
      path: 'target',
      vars: {},
      stage: 'test',
    });
  });
});

describe('Evaluate build time operators', () => {
  test('Evaluate build time operators in lowdefy.yaml', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
answer:
  _build.sum:
    - 1
    - 1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      answer: 2,
    });
  });

  test('Evaluate build time operators in referenced file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
answer:
  _ref: file.yaml`,
      },
      {
        path: 'file.yaml',
        content: `
_build.sum:
  - 1
  - 1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      answer: 2,
    });
  });

  test('Build time operator error in lowdefy.yaml', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
answer:
  _build.sum: A`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      answer: null,
    });
    expect(mockLogWarn.mock.calls).toEqual([
      ['Build operator errors.'],
      ['Operator Error: _sum takes an array type as input. Received: "A" at lowdefy.yaml.'],
    ]);
  });

  test('Build time operator error in referenced file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
answer:
  _ref: file.yaml`,
      },
      {
        path: 'file.yaml',
        content: `
_build.sum: A`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res).toEqual({
      answer: null,
    });
    expect(mockLogWarn.mock.calls).toEqual([
      ['Build operator errors.'],
      ['Operator Error: _sum takes an array type as input. Received: "A" at file.yaml.'],
    ]);
  });
});
