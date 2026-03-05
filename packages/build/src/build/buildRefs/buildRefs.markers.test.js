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

import testContext from '../../test-utils/testContext.js';
import buildRefs from './buildRefs.js';

const mockReadConfigFile = jest.fn();

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

const context = testContext({
  readConfigFile: mockReadConfigFile,
});

context.errors = [];
context.keyMap = context.keyMap ?? {};
context.unresolvedRefVars = context.unresolvedRefVars ?? {};

function findRefId(refMap, filePath) {
  return Object.entries(refMap).find(([, entry]) => entry.path === filePath)?.[0];
}

function findRootRefId(refMap) {
  return Object.entries(refMap).find(([, entry]) => entry.parent === null)?.[0];
}

beforeEach(() => {
  context.errors = [];
  context.unresolvedRefVars = {};
  context.refMap = {};
  context.keyMap = {};
  mockReadConfigFile.mockReset();
});

describe('~r provenance', () => {
  test('~r on simple ref points to child file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
child:
  _ref: child.yaml`,
      },
      {
        path: 'child.yaml',
        content: `
field: value
nested:
  inner: 1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    const childRefId = findRefId(context.refMap, 'child.yaml');
    expect(childRefId).toBeDefined();
    expect(res.child['~r']).toBe(childRefId);
    expect(res.child.nested['~r']).toBe(childRefId);
  });

  test('~r on nested refs (3 levels) points to respective files', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
top:
  _ref: level1.yaml`,
      },
      {
        path: 'level1.yaml',
        content: `
a: 1
mid:
  _ref: level2.yaml`,
      },
      {
        path: 'level2.yaml',
        content: `b: 2`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    const level1Id = findRefId(context.refMap, 'level1.yaml');
    const level2Id = findRefId(context.refMap, 'level2.yaml');
    expect(level1Id).toBeDefined();
    expect(level2Id).toBeDefined();
    expect(res.top['~r']).toBe(level1Id);
    expect(res.top.mid['~r']).toBe(level2Id);
    expect(level1Id).not.toBe(level2Id);
  });

  test('~r on var from parent points to parent ref', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
out:
  _ref:
    path: template.yaml
    vars:
      data:
        key: value`,
      },
      {
        path: 'template.yaml',
        content: `
result:
  _var: data`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    const rootId = findRootRefId(context.refMap);
    expect(rootId).toBeDefined();
    expect(res.out.result['~r']).toBe(rootId);
  });

  test('~r on var default points to template file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
out:
  _ref: template.yaml`,
      },
      {
        path: 'template.yaml',
        content: `
result:
  _var:
    key: missing
    default:
      fallback: true`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    const templateRefId = findRefId(context.refMap, 'template.yaml');
    expect(templateRefId).toBeDefined();
    expect(res.out.result['~r']).toBe(templateRefId);
  });

  test('~r on _build operator result points to source file', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
merged:
  _ref: file.yaml`,
      },
      {
        path: 'file.yaml',
        content: `
_build.object.assign:
  - a: 1
  - b: 2`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    const fileRefId = findRefId(context.refMap, 'file.yaml');
    expect(fileRefId).toBeDefined();
    expect(res.merged['~r']).toBe(fileRefId);
  });

  test('~r on transformer result points to ref entry', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
transformed:
  _ref:
    path: target.yaml
    transformer: src/test-utils/buildRefs/testBuildRefsTransformIdentity.js
    vars:
      myVar: hello`,
      },
      {
        path: 'target.yaml',
        content: `a: 1`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    const targetRefId = findRefId(context.refMap, 'target.yaml');
    expect(targetRefId).toBeDefined();
    expect(res.transformed['~r']).toBe(targetRefId);
  });

  test('~r full chain: ref, var, and operator each track their source', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
_ref:
  path: template.yaml
  vars:
    items:
      - x: 1`,
      },
      {
        path: 'template.yaml',
        content: `
blocks:
  _build.array.concat:
    - _var: items
    - - y: 2`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    const rootId = findRootRefId(context.refMap);
    const templateId = findRefId(context.refMap, 'template.yaml');
    expect(rootId).toBeDefined();
    expect(templateId).toBeDefined();
    // { x: 1 } came from var (parent provided)
    expect(res.blocks[0]['~r']).toBe(rootId);
    // { y: 2 } is a template literal
    expect(res.blocks[1]['~r']).toBe(templateId);
    // Concat result array gets ~r from template (operator evaluated in template context)
    expect(res.blocks['~r']).toBe(templateId);
  });
});

describe('~ignoreBuildChecks', () => {
  test('~ignoreBuildChecks propagates through ref resolution', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
pages:
  - _ref:
      path: page.yaml
      ~ignoreBuildChecks: true`,
      },
      {
        path: 'page.yaml',
        content: `
id: test
blocks: []`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res.pages[0]['~ignoreBuildChecks']).toBe(true);
  });
});

describe('mutation safety', () => {
  test('same file referenced from two locations produces distinct copies', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
first:
  _ref: shared.yaml
second:
  _ref: shared.yaml`,
      },
      {
        path: 'shared.yaml',
        content: `
a: 1
nested:
  b: 2`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res.first).not.toBe(res.second);
    expect(res.first.nested).not.toBe(res.second.nested);
    // toEqual checks user-visible shape; ~r markers are non-enumerable
    expect(res.first).toEqual({ a: 1, nested: { b: 2 } });
    expect(res.second).toEqual({ a: 1, nested: { b: 2 } });
    // Each ref creates a separate refDef, both pointing to shared.yaml
    expect(context.refMap[res.first['~r']].path).toBe('shared.yaml');
    expect(context.refMap[res.second['~r']].path).toBe('shared.yaml');
    expect(res.first['~r']).not.toBe(res.second['~r']);
  });

  test('same file with different vars produces independent results', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
a:
  _ref:
    path: template.yaml
    vars:
      val: alpha
b:
  _ref:
    path: template.yaml
    vars:
      val: beta`,
      },
      {
        path: 'template.yaml',
        content: `
result:
  _var: val`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res.a.result).toBe('alpha');
    expect(res.b.result).toBe('beta');
  });
});

describe('~l line numbers', () => {
  test('~l survives through buildRefs pipeline', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
child:
  _ref: child.yaml`,
      },
      {
        path: 'child.yaml',
        content: `top:
  inner: 1
  nested:
    deep: 2`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    expect(res.child['~l']).toBeDefined();
    expect(typeof res.child['~l']).toBe('number');
    expect(res.child.top['~l']).toBeDefined();
    expect(typeof res.child.top['~l']).toBe('number');
    // ~l should be non-enumerable
    expect(Object.keys(res.child)).not.toContain('~l');
  });
});

describe('NaN and Infinity', () => {
  test('NaN and Infinity in YAML fields become null after serializer round-trips', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
data:
  _ref: data.yaml`,
      },
      {
        path: 'data.yaml',
        content: `
nan_val: .nan
inf_val: .inf
neg_inf_val: -.inf
normal: 42`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    // NaN and Infinity are lost via JSON round-trips in serializer.copy
    // Walker refactor will preserve these (update assertions after walker lands)
    expect(res.data.nan_val).toBeNull();
    expect(res.data.inf_val).toBeNull();
    expect(res.data.neg_inf_val).toBeNull();
    expect(res.data.normal).toBe(42);
  });
});

describe('shallow build with operators', () => {
  // Outer beforeEach resets refMap, keyMap, errors, etc.
  beforeEach(() => {
    context.typesMap = {
      blocks: { PageHeaderMenu: {}, TextInput: {} },
    };
  });

  test('_build.if wrapping a shallow ref is preserved with ~dyn', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
pages:
  - id: home
    type: PageHeaderMenu
    blocks:
      _build.if:
        test: true
        then:
          _ref: pages/blocks.yaml
        else: []`,
      },
      {
        path: 'pages/blocks.yaml',
        content: `
- id: block1
  type: TextInput`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({
      context,
      shallowOptions: true,
    });
    // _build.if is preserved (not evaluated) because it wraps ~shallow content
    expect(res.pages[0].blocks['_build.if']).toBeDefined();
    expect(res.pages[0].blocks['_build.if'].then['~shallow']).toBe(true);
    // ~dyn marker is set on blocks (non-enumerable)
    expect(res.pages[0].blocks['~dyn']).toBeDefined();
  });

  test('_build.object.assign wrapping a shallow ref is preserved with ~dyn', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
pages:
  - id: home
    type: PageHeaderMenu
    events:
      _build.object.assign:
        - _ref: pages/events.yaml
        - onInit: []`,
      },
      {
        path: 'pages/events.yaml',
        content: `onClick: []`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({
      context,
      shallowOptions: true,
    });
    // _build.object.assign is preserved because it wraps ~shallow content
    expect(res.pages[0].events['_build.object.assign']).toBeDefined();
    const args = res.pages[0].events['_build.object.assign'];
    expect(args[0]['~shallow']).toBe(true);
    // ~dyn marker is set on events
    expect(res.pages[0].events['~dyn']).toBeDefined();
  });

  test('_build.operator dynamic dispatch evaluates at build time', async () => {
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
result:
  _build.operator:
    name: _sum
    params:
      - 10
      - 20`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    const res = await buildRefs({ context });
    // _build.operator with _sum dispatches correctly despite _operator.dynamic = true
    expect(res.result).toBe(30);
  });
});
