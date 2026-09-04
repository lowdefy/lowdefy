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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REMOVED_BLOCK_METHODS } from '@lowdefy/block-utils';
import { BlockError } from '@lowdefy/errors';

import createBlockMethods from './createBlockMethods.js';

const blockDirectory = path.dirname(fileURLToPath(import.meta.url));

function createMethods() {
  return {
    registerEvent: () => 'registerEvent',
    registerMethod: () => 'registerMethod',
    triggerEvent: () => 'triggerEvent',
  };
}

test('createBlockMethods throws a located BlockError naming the block, type and replacement for a removed method', () => {
  const methods = createBlockMethods({
    blockId: 'my-autocomplete',
    blockType: 'MyAutocomplete',
    configKey: 'k-42',
    methods: createMethods(),
  });
  let error;
  try {
    methods.makeCssClass({ color: 'red' });
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(BlockError);
  expect(error.message).toContain('Block "my-autocomplete" (type MyAutocomplete)');
  expect(error.message).toContain('removed block method "makeCssClass"');
  expect(error.message).toContain('classNames');
  expect(error.message).toContain('(plugin API v1)');
  expect(error.typeName).toBe('MyAutocomplete');
  expect(error.configKey).toBe('k-42');
  expect(error.isLowdefyError).toBe(true);
});

test('createBlockMethods returns live methods unchanged', () => {
  const bag = createMethods();
  const methods = createBlockMethods({
    blockId: 'b1',
    blockType: 'Button',
    configKey: 'k-1',
    methods: bag,
  });
  expect(methods.triggerEvent).toBe(bag.triggerEvent);
  expect(methods.triggerEvent()).toBe('triggerEvent');
  expect(methods.registerMethod).toBe(bag.registerMethod);
});

test('createBlockMethods throws a located BlockError listing the available methods for a key the bag does not have', () => {
  const methods = createBlockMethods({
    blockId: 'b1',
    blockType: 'Button',
    configKey: 'k-1',
    methods: createMethods(),
  });
  let error;
  try {
    methods.someUnknownMethod();
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(BlockError);
  expect(error.message).toContain('Block "b1" (type Button)');
  expect(error.message).toContain('block method "someUnknownMethod", which it does not have');
  expect(error.message).toContain('Available methods: registerEvent, registerMethod, triggerEvent');
  expect(error.configKey).toBe('k-1');
});

test('createBlockMethods passes through the keys JavaScript itself probes for', () => {
  const methods = createBlockMethods({
    blockId: 'b1',
    blockType: 'Button',
    configKey: 'k-1',
    methods: createMethods(),
  });
  expect(methods.then).toBeUndefined();
  expect(methods.toJSON).toBeUndefined();
  expect(methods.toString).toBe(Object.prototype.toString);
  expect(() => JSON.stringify(methods)).not.toThrow();
});

test('createBlockMethods passes through keys that do not look like method names', () => {
  const methods = createBlockMethods({
    blockId: 'b1',
    blockType: 'Button',
    configKey: 'k-1',
    methods: createMethods(),
  });
  expect(methods.Component).toBeUndefined();
  expect(methods['not a method']).toBeUndefined();
  expect(methods._private).toBeUndefined();
});

test('createBlockMethods does not throw for a removed name the block registered itself', () => {
  const bag = { ...createMethods(), makeCssClass: () => 'my-own-class' };
  const methods = createBlockMethods({
    blockId: 'b1',
    blockType: 'Legacy',
    configKey: 'k-1',
    methods: bag,
  });
  expect(methods.makeCssClass()).toBe('my-own-class');
});

test('createBlockMethods leaves has, set and ownKeys behaviour unchanged', () => {
  const bag = createMethods();
  const methods = createBlockMethods({
    blockId: 'b1',
    blockType: 'Button',
    configKey: 'k-1',
    methods: bag,
  });
  expect('makeCssClass' in methods).toBe(false);
  expect('triggerEvent' in methods).toBe(true);
  methods.reset = () => 'reset';
  expect(bag.reset()).toBe('reset');
  expect(Object.keys(methods)).toEqual([
    'registerEvent',
    'registerMethod',
    'triggerEvent',
    'reset',
  ]);
  expect({ ...methods }).toEqual(bag);
});

test('createBlockMethods passes through symbol keys without throwing', () => {
  const methods = createBlockMethods({
    blockId: 'b1',
    blockType: 'Button',
    configKey: 'k-1',
    methods: createMethods(),
  });
  expect(methods[Symbol.iterator]).toBeUndefined();
});

test('createBlockMethods keeps the methods prop referentially stable across renders', () => {
  const bag = createMethods();
  const first = createBlockMethods({
    blockId: 'b1',
    blockType: 'Button',
    configKey: 'k-1',
    methods: bag,
  });
  const second = createBlockMethods({
    blockId: 'b1',
    blockType: 'Button',
    configKey: 'k-1',
    methods: bag,
  });
  expect(second).toBe(first);
  const other = createBlockMethods({
    blockId: 'b2',
    blockType: 'Button',
    configKey: 'k-2',
    methods: createMethods(),
  });
  expect(other).not.toBe(first);
});

// Mechanical invariants over whatever files exist, so the next author cannot forget.
function blockSourceFiles() {
  return fs
    .readdirSync(blockDirectory)
    .filter(
      (name) =>
        name.endsWith('.js') && !name.endsWith('.test.js') && name !== 'createBlockMethods.js'
    )
    .sort();
}

test('every render site that hands a block its engine methods wraps them in createBlockMethods', () => {
  let renderSites = 0;
  const unwrapped = blockSourceFiles().filter((name) => {
    const source = fs.readFileSync(path.join(blockDirectory, name), 'utf8');
    const bags = (source.match(/Object\.assign\(block\.methods,/g) ?? []).length;
    const wrapped = (source.match(/createBlockMethods\(\{/g) ?? []).length;
    renderSites += bags;
    return bags !== wrapped;
  });
  expect(unwrapped).toEqual([]);
  expect(renderSites).toBe(5);
});

test('no REMOVED_BLOCK_METHODS key is a method the client puts on the bag', () => {
  const assigned = new Set();
  for (const name of blockSourceFiles()) {
    const source = fs.readFileSync(path.join(blockDirectory, name), 'utf8');
    for (const match of source.matchAll(/methods: Object\.assign\(block\.methods, \{([^}]*)\}/g)) {
      for (const key of match[1].matchAll(/^\s*([A-Za-z][A-Za-z0-9]*):/gm)) {
        assigned.add(key[1]);
      }
    }
  }
  expect(assigned.size).toBeGreaterThan(0);
  for (const removed of Object.keys(REMOVED_BLOCK_METHODS)) {
    expect(Array.from(assigned)).not.toContain(removed);
  }
});
