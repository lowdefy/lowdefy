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

import { test, expect } from '@playwright/test';
import { getBlock, navigateToTestPage } from '@lowdefy/block-dev-e2e';
import { escapeId } from '@lowdefy/e2e-utils';

// Stack renders a flex column with id={blockId}.
// Structure: #bl-{blockId} (layout wrapper) > #{blockId} (flex container)
const getStackElement = (page, blockId) => page.locator(`#${escapeId(blockId)}`);

test.describe('Stack Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'stack');
  });

  test('renders a flex column', async ({ page }) => {
    const stack = getStackElement(page, 'stack_basic');
    await expect(stack).toBeVisible();
    await expect(stack).toHaveCSS('display', 'flex');
    await expect(stack).toHaveCSS('flex-direction', 'column');
  });

  test('stacks children vertically and keeps their #bl- wrappers', async ({ page }) => {
    const first = getBlock(page, 'stack_basic_first');
    const second = getBlock(page, 'stack_basic_second');
    await expect(first).toBeVisible();
    await expect(second).toBeVisible();
    const firstBox = await first.boundingBox();
    const secondBox = await second.boundingBox();
    expect(secondBox.y).toBeGreaterThan(firstBox.y);
    expect(secondBox.x).toBe(firstBox.x);
  });

  test('align maps to an items-* utility', async ({ page }) => {
    const stack = getStackElement(page, 'stack_aligned');
    await expect(stack).toHaveCSS('align-items', 'center');
    const child = getBlock(page, 'stack_aligned_child');
    const stackBox = await stack.boundingBox();
    const childBox = await child.boundingBox();
    expect(childBox.width).toBe(128);
    expect(childBox.x).toBeGreaterThan(stackBox.x);
  });

  test('a nested Row arranges its own children in a line', async ({ page }) => {
    const left = getBlock(page, 'stack_nested_left');
    const right = getBlock(page, 'stack_nested_right');
    const leftBox = await left.boundingBox();
    const rightBox = await right.boundingBox();
    expect(rightBox.x).toBeGreaterThan(leftBox.x);
    expect(rightBox.y).toBe(leftBox.y);
  });
});
