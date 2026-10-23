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
