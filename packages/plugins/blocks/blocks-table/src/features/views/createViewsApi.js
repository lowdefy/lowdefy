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

const DEFAULT_MENU_KEY = 'delete';

// `api.views`: the saved views, the active one, whether the current view differs from it, and
// the tab actions. The app stores views; these only load them and fire the events (D7).
function createViewsApi({ api, active, currentView, dirty, setActiveId, viewMenu = null, views }) {
  function load(target) {
    const current = api.getValue();
    api.loadValue(
      { view: target.view, selected: current.selected, expanded: current.expanded },
      { cause: 'view' }
    );
  }
  function remove(view) {
    api.methods.triggerEvent({ name: 'onViewDelete', event: { id: view.id } });
  }
  return {
    active,
    dirty,
    items: views,
    select(key) {
      const target = views.find((view) => view.key === key);
      if (!target || target === active) return;
      setActiveId(target.id);
      api.pendingViewSelect = target.id;
      load(target);
    },
    save() {
      api.methods.triggerEvent({
        name: 'onViewSave',
        event: { view: currentView, id: active.id, title: active.title, shared: active.shared },
      });
    },
    saveAs({ title, shared }) {
      api.methods.triggerEvent({
        name: 'onViewSave',
        event: { view: currentView, title, shared: shared === true },
      });
    },
    // With onViewSaveAs actions, Save as is the app's: it opens its own dialog and stores the view.
    handsSaveAs: Boolean(api.events.onViewSaveAs),
    requestSaveAs() {
      api.methods.triggerEvent({ name: 'onViewSaveAs', event: { view: currentView } });
    },
    discard() {
      load(active);
    },
    remove,
    // A view tab's menu: the app's `viewMenu` items, or Delete view, disabled on a locked view.
    menuItems(view) {
      if (viewMenu === null) {
        return [
          {
            key: DEFAULT_MENU_KEY,
            label: 'Delete view',
            danger: true,
            disabled: view.locked,
            confirm: false,
          },
        ];
      }
      return viewMenu.map((item) => ({ ...item, disabled: false }));
    },
    selectMenuItem({ key, view }) {
      if (viewMenu === null) {
        if (key === DEFAULT_MENU_KEY && !view.locked) remove(view);
        return;
      }
      if (!viewMenu.some((item) => item.key === key)) return;
      api.methods.triggerEvent({ name: 'onViewMenu', event: { key, id: view.id } });
    },
    load,
  };
}

export default createViewsApi;
