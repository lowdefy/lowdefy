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

import { getPageJitEnrichment } from './jitPageBuilder.js';

// A stub of cachedBuildContext. getPageJitEnrichment reads jsMap.client and
// dynamicIconData off it; production omits buildContext so it defaults to the
// module-private cachedBuildContext.
function buildContext({ client = {}, modules = {}, dynamicIconData = {} } = {}) {
  return {
    jsMap: { client, server: {} },
    jsModules: { client: modules, server: {} },
    dynamicIconData,
  };
}

test('getPageJitEnrichment scopes string-form, object-form, and args-nested _js hashes', () => {
  const client = {
    hashString: 'return args.x + 1;',
    hashFn: 'return 2;',
    hashNested: 'return 3;',
    hashUnused: 'return 4;', // present in the map but not referenced by the page
  };
  const pageConfig = {
    id: 'p',
    blocks: [
      { properties: { value: { _js: 'hashString' } } },
      // object form; the args carry another _js node that must be descended into
      { properties: { compute: { _js: { fn: 'hashFn', args: { seed: { _js: 'hashNested' } } } } } },
      // referenced but absent from the client map — excluded, no crash
      { properties: { missing: { _js: 'hashAbsent' } } },
    ],
  };

  const { jsEntries } = getPageJitEnrichment({
    pageConfig,
    buildContext: buildContext({ client }),
  });

  expect(jsEntries).toContain("'hashString'");
  expect(jsEntries).toContain("'hashFn'");
  expect(jsEntries).toContain("'hashNested'");
  expect(jsEntries).not.toContain("'hashUnused'");
  expect(jsEntries).not.toContain("'hashAbsent'");
});

test('getPageJitEnrichment discovers an icon name that appears only inside a _js source', () => {
  const client = {
    // The icon name lives only in the function body, in double quotes — the
    // served pageConfig has this replaced by the hash, so scanning the config
    // alone would miss it. Only FiZap is a real dynamic icon.
    hashIcon: 'return on ? "FiZap" : "FiZapOff";',
  };
  const pageConfig = {
    id: 'p',
    blocks: [{ properties: { icon: { _js: 'hashIcon' } } }],
  };

  const { dynamicIcons } = getPageJitEnrichment({
    pageConfig,
    buildContext: buildContext({ client, dynamicIconData: { FiZap: { tag: 'svg' } } }),
  });

  expect(dynamicIcons).toEqual({ FiZap: { tag: 'svg' } });
});

test('getPageJitEnrichment scopes icons referenced directly in the page config', () => {
  const pageConfig = { id: 'p', blocks: [{ properties: { icon: 'FiStar' } }] };

  const { dynamicIcons } = getPageJitEnrichment({
    pageConfig,
    buildContext: buildContext({
      dynamicIconData: { FiStar: { tag: 'svg' }, FiOther: { tag: 'svg' } },
    }),
  });

  expect(dynamicIcons).toEqual({ FiStar: { tag: 'svg' } });
});

test('getPageJitEnrichment returns {} when there is no build context', () => {
  expect(getPageJitEnrichment({ pageConfig: { id: 'p' }, buildContext: null })).toEqual({});
});

test('getPageJitEnrichment omits both fields when the page has no dynamic _js or icons', () => {
  const pageConfig = { id: 'p', blocks: [{ properties: { title: 'Hello' } }] };

  const enrichment = getPageJitEnrichment({
    pageConfig,
    buildContext: buildContext({
      client: { hashUnused: 'return 1;' },
      dynamicIconData: { FiZap: {} },
    }),
  });

  expect(enrichment).toEqual({ jsEntries: undefined, dynamicIcons: undefined });
});

test('getPageJitEnrichment emits an await import preamble for module hashes and plain entries otherwise', () => {
  const client = { hashInline: 'return 1;' };
  const modules = {
    hashZ: { absolutePath: '/app/lib/z.js', exportName: 'default', relativePath: 'lib/z.js' },
    hashA: {
      absolutePath: '/app/pages/lib/rows.js',
      exportName: 'buildRows',
      relativePath: 'pages/lib/rows.js',
    },
    hashUnused: { absolutePath: '/app/lib/u.js', exportName: 'u', relativePath: 'lib/u.js' },
  };
  const pageConfig = {
    id: 'p',
    blocks: [
      { properties: { a: { _js: 'hashInline' } } },
      { properties: { b: { _js: { fn: 'hashA', args: { c: { _js: { fn: 'hashZ' } } } } } } },
    ],
  };

  const { jsEntries } = getPageJitEnrichment({
    pageConfig,
    buildContext: buildContext({ client, modules }),
  });

  expect(jsEntries).toBe(`const m0 = await import('/@fs/app/pages/lib/rows.js');
const m1 = await import('/@fs/app/lib/z.js');
export default {
  'hashInline': ({ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }) => { return 1; },
  'hashA': m0.buildRows,
  'hashZ': m1.default,
  };`);
});

test('getPageJitEnrichment emits module entries when the page has no inline bodies', () => {
  const modules = {
    hashA: { absolutePath: '/app/lib/a.js', exportName: 'a', relativePath: 'lib/a.js' },
  };
  const { jsEntries } = getPageJitEnrichment({
    pageConfig: { id: 'p', blocks: [{ properties: { a: { _js: { fn: 'hashA' } } } }] },
    buildContext: buildContext({ modules }),
  });
  expect(jsEntries).toBe(`const m0 = await import('/@fs/app/lib/a.js');
export default {
  'hashA': m0.a,
  };`);
});

test('getPageJitEnrichment emits no preamble when the page references no module', () => {
  const { jsEntries } = getPageJitEnrichment({
    pageConfig: { id: 'p', blocks: [{ properties: { a: { _js: 'hashInline' } } }] },
    buildContext: buildContext({ client: { hashInline: 'return 1;' } }),
  });
  expect(jsEntries).not.toContain('await import');
  expect(jsEntries).toContain("'hashInline'");
});
