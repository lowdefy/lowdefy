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
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import prevNextBlocks from './prevNextBlocks.js';
import walkMenus from './walkMenus.js';

/*
  Per-page navigation state, used as a `_ref` transformer on menus.yaml from
  general.yaml.njk:

    _ref:
      path: menus.yaml
      transformer: templates/navFromMenus.js
      vars:
        pageId: <pageId>
        field: menuId | tab | breadcrumb | prevNextNav

  Why a per-ref transformer and not a pages.yaml-level transformer: the dev
  server's shallow/JIT build resolves each page's refs individually and never
  re-runs list-level transformers over rendered pages, so mutations made there
  only exist in full production builds. Nested refs (and their transformers)
  run through the shared ref walker in BOTH pipelines — and they also make
  every page a tracked dependent of menus.yaml, so menu edits invalidate
  pages correctly in dev.

  Pages that appear in no menu (404) fall back to the Learn tab and render no
  breadcrumb trail or prev/next buttons.
*/

const version = JSON.parse(
  fs.readFileSync(path.join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8')
).version;

function navFromMenus(menus, vars) {
  const { records } = walkMenus(menus);
  const record = records.get(vars.pageId);

  switch (vars.field) {
    case 'tab':
      return record?.tab ?? 'learn';
    case 'menuId':
      return `menu-${record?.tab ?? 'learn'}`;
    case 'breadcrumb':
      if (!record) return [version];
      return [version, ...record.trail, vars.pageTitle ?? record.title];
    case 'prevNextNav':
      if (!record) return { id: 'prev_next_nav', type: 'Box', blocks: [] };
      return prevNextBlocks({ prev: record.prev, next: record.next });
    default:
      throw new Error(`navFromMenus: unknown field "${vars.field}" for page "${vars.pageId}".`);
  }
}

export default navFromMenus;
