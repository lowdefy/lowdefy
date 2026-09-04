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
import { expect, test } from '@playwright/test';

import {
  blocksDirectory,
  callsBlockRootProps,
  delegatedRoots,
  exemptBlocks,
  listBlockMainFiles,
} from './blockRootContract.mjs';

// The source-scan half of the block root contract gate: it reads block sources,
// never the browser, so it holds for every block package in the repo regardless
// of which app is under test. It uses no page fixture.

const recorded = new Map([
  ...delegatedRoots.map(({ file, via }) => [file, `root delegated to ${via}`]),
  ...exemptBlocks.map(({ file, reason }) => [file, reason]),
]);

test.describe('block root contract', () => {
  test('every block main file renders blockRootProps on its root', () => {
    const missing = listBlockMainFiles()
      .filter((block) => !recorded.has(block.file))
      .filter((block) => !callsBlockRootProps(block))
      .map(({ file }) => file);
    expect(missing).toEqual([]);
  });

  test('every recorded delegation or exemption is still a block that does not call the helper', () => {
    const stale = [...recorded.keys()].filter((file) => {
      const filePath = path.join(blocksDirectory, ...file.split('/'));
      if (!fs.existsSync(filePath)) return true;
      return callsBlockRootProps({ path: filePath });
    });
    expect(stale).toEqual([]);
  });

  test('the scan reaches every block package', () => {
    const packages = new Set(listBlockMainFiles().map(({ file }) => file.split('/')[0]));
    expect([...packages].sort()).toEqual([
      'blocks-aggrid',
      'blocks-antd',
      'blocks-antd-x',
      'blocks-basic',
      'blocks-captcha',
      'blocks-diff',
      'blocks-echarts',
      'blocks-files',
      'blocks-google-maps',
      'blocks-loaders',
      'blocks-markdown',
      'blocks-qr',
      'blocks-tiptap',
    ]);
  });
});
