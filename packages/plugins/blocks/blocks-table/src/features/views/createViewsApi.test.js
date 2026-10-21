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

import createViewsApi from './createViewsApi.js';
import normalizeViewMenu from './normalizeViewMenu.js';

function makeApi(events) {
  const fired = [];
  return {
    fired,
    events,
    getValue: () => ({ view: {} }),
    loadValue: () => {},
    methods: { triggerEvent: (call) => fired.push(call) },
  };
}

const active = { id: 'v1', key: 'v1', title: 'Won', shared: true, view: {} };
const currentView = { filter: { key: 'stage', op: 'eq', value: 'won' } };

function viewsFor(api) {
  return createViewsApi({
    api,
    active,
    currentView,
    dirty: true,
    setActiveId: () => {},
    views: [active],
  });
}

test('createViewsApi with onViewSaveAs actions hands Save as to the app, firing onViewSaveAs with the current view', () => {
  const api = makeApi({ onViewSaveAs: [{ id: 'open', type: 'SetState' }] });
  const views = viewsFor(api);
  expect(views.handsSaveAs).toBe(true);
  views.requestSaveAs();
  expect(api.fired).toEqual([{ name: 'onViewSaveAs', event: { view: currentView } }]);
});

test('createViewsApi without onViewSaveAs actions keeps the popover, firing onViewSave', () => {
  const api = makeApi({});
  const views = viewsFor(api);
  expect(views.handsSaveAs).toBe(false);
  views.saveAs({ title: 'Won deals', shared: false });
  expect(api.fired).toEqual([
    { name: 'onViewSave', event: { view: currentView, title: 'Won deals', shared: false } },
  ]);
});

describe('view tab menu', () => {
  function viewsApiFor(viewMenu) {
    const fired = [];
    const api = {
      events: {},
      getValue: () => ({ view: {} }),
      loadValue: () => {},
      methods: { triggerEvent: (call) => fired.push(call) },
    };
    const viewsApi = createViewsApi({
      api,
      active: null,
      currentView: {},
      dirty: false,
      setActiveId: () => {},
      viewMenu: normalizeViewMenu(viewMenu),
      views: [],
    });
    return { viewsApi, fired };
  }

  const view = { id: 'view-1', key: 'view-1', locked: false };
  const lockedView = { id: 'view-2', key: 'view-2', locked: true };

  const menu = [
    { key: 'rename', label: 'Rename' },
    { key: 'duplicate', label: 'Duplicate' },
    { key: 'archive', label: 'Archive', danger: true, confirm: 'Archive this view?' },
  ];

  test('createViewsApi with viewMenu lists its items and fires onViewMenu with the key and view id', () => {
    const { viewsApi, fired } = viewsApiFor(menu);
    expect(viewsApi.menuItems(view)).toEqual([
      { key: 'rename', label: 'Rename', danger: false, confirm: false, disabled: false },
      { key: 'duplicate', label: 'Duplicate', danger: false, confirm: false, disabled: false },
      {
        key: 'archive',
        label: 'Archive',
        danger: true,
        confirm: 'Archive this view?',
        disabled: false,
      },
    ]);
    viewsApi.selectMenuItem({ key: 'duplicate', view });
    expect(fired).toEqual([{ name: 'onViewMenu', event: { key: 'duplicate', id: 'view-1' } }]);
  });

  test('createViewsApi with viewMenu passes a confirmed item its message, and a locked view keeps custom items enabled', () => {
    const { viewsApi, fired } = viewsApiFor(menu);
    const archive = viewsApi.menuItems(lockedView).find((item) => item.key === 'archive');
    expect(archive.confirm).toBe('Archive this view?');
    expect(archive.disabled).toBe(false);
    viewsApi.selectMenuItem({ key: 'archive', view: lockedView });
    expect(fired).toEqual([{ name: 'onViewMenu', event: { key: 'archive', id: 'view-2' } }]);
    // A key the menu does not list fires nothing, and Delete is not among a custom menu's items.
    viewsApi.selectMenuItem({ key: 'delete', view });
    expect(fired.length).toBe(1);
  });

  test('createViewsApi without viewMenu keeps Delete view, firing onViewDelete', () => {
    const { viewsApi, fired } = viewsApiFor(undefined);
    expect(viewsApi.menuItems(view)).toEqual([
      { key: 'delete', label: 'Delete view', danger: true, disabled: false, confirm: false },
    ]);
    viewsApi.selectMenuItem({ key: 'delete', view });
    expect(fired).toEqual([{ name: 'onViewDelete', event: { id: 'view-1' } }]);
  });

  test('createViewsApi disables only the default Delete on a locked view', () => {
    const { viewsApi, fired } = viewsApiFor(undefined);
    expect(viewsApi.menuItems(lockedView)[0].disabled).toBe(true);
    viewsApi.selectMenuItem({ key: 'delete', view: lockedView });
    expect(fired).toEqual([]);
  });
});
