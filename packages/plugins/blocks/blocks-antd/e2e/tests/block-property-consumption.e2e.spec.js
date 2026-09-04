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

import { expect, test } from '@playwright/test';

import {
  knownMismatches,
  readPropertyNames,
  scanBlockPropertyConsumption,
} from './blockPropertyConsumption.mjs';

// A source scan, like no-deprecated-antd-props beside it: it reads block sources
// and their metas, never the browser, so it holds whatever the app under test is
// built as and needs no page fixture. Playwright hosts it only because it is the
// runner these packages have. It covers blocks-antd and blocks-basic together -
// one scan for the two packages the framework owns, run from the package that
// already has a runner.

function describeFinding({ block, direction, package: packageName, property }) {
  return `${packageName}/${block} ${direction} "${property}"`;
}

const scan = await scanBlockPropertyConsumption();

test.describe('block property consumption', () => {
  test('every declared property is read, and every property read is declared', () => {
    const recorded = new Set(knownMismatches.map(describeFinding));
    const unexpected = scan.findings.filter((finding) => !recorded.has(describeFinding(finding)));
    expect(unexpected.map(describeFinding)).toEqual([]);
  });

  test('every recorded mismatch is still present, so the list does not rot', () => {
    const found = new Set(scan.findings.map(describeFinding));
    const stale = knownMismatches.filter((mismatch) => !found.has(describeFinding(mismatch)));
    expect(stale.map(describeFinding)).toEqual([]);
  });

  test("only reads of the block's own properties count as a property read", () => {
    expect([...readPropertyNames('const a = link.properties.shortcut;')]).toEqual([]);
    expect([...readPropertyNames('const a = properties.title;')]).toEqual(['title']);
    expect([...readPropertyNames('const a = this.props.properties.title;')]).toEqual(['title']);
    expect([...readPropertyNames("const a = properties?.['size'];")]).toEqual(['size']);
  });

  // A scan that stopped finding blocks would pass the checks above while testing
  // nothing. The floors sit below the current counts by enough that adding or
  // removing a block does not move them.
  test('the scan reaches the blocks of both packages', () => {
    expect(scan.counts.blocks).toBeGreaterThan(80);
    expect(scan.counts.properties).toBeGreaterThan(700);
  });
});
