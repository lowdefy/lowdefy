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
import { BlockError } from '@lowdefy/errors';

import createBlockMethods from './createBlockMethods.js';

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

test('createBlockMethods returns undefined for an unknown key that was never a plugin API member', () => {
  const methods = createBlockMethods({
    blockId: 'b1',
    blockType: 'Button',
    configKey: 'k-1',
    methods: createMethods(),
  });
  expect(methods.someUnknownMethod).toBeUndefined();
  expect(() => methods.someUnknownMethod).not.toThrow();
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
