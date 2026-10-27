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

import { appStorageKey, type } from '@lowdefy/helpers';

import loadDayjsLocale from './loadDayjsLocale.js';
import resolveActiveLocale from './resolveActiveLocale.js';

/**
 * The locale of one app in the shell, kept as the web client keeps it (useLocale): the app's
 * i18n config from the mobile root, the person's choice that SetLocale sets and the device store
 * keeps under the app's key, and the device's locale.
 *
 * `apply` points the app at its active locale: `lowdefy.i18n` (read by `_t`, `_locale` and
 * translate), the window members the engine trace reads, and the dayjs locale `_dayjs` formats
 * with. Screens call it as they render and re-render on `subscribe`.
 *
 * It sets `window.__lowdefy_setLocale`, which actions-core's SetLocale calls.
 *
 * @param {Object} params
 * @param {() => string[]} params.getDeviceLocales
 * @param {Object} params.globals The app's host globals.
 * @param {Object} params.session The app's session (createAppSession).
 * @param {Object} params.storage The device store.
 */
function createShellLocale({ getDeviceLocales, globals, session, storage }) {
  const listeners = new Set();
  let version = 0;

  function getStorageKey() {
    const { rootConfig } = session.getState();
    return appStorageKey({
      basePath: '',
      name: 'lowdefy_locale',
      slug: rootConfig.lowdefyApp.slug,
    });
  }

  // A host store may throw when the platform blocks storage, as the core allows; the choice then
  // lasts only while the app runs.
  function readPreference() {
    try {
      return storage.get(getStorageKey()) ?? 'auto';
    } catch {
      return 'auto';
    }
  }

  function writePreference(preference) {
    try {
      if (preference === 'auto') {
        storage.remove(getStorageKey());
        return;
      }
      storage.set(getStorageKey(), preference);
    } catch {
      // See readPreference.
    }
  }

  function apply() {
    const { lowdefy, rootConfig } = session.getState();
    const { i18n } = rootConfig;
    if (type.isNone(i18n.defaultLocale)) {
      return;
    }
    const active = resolveActiveLocale({
      deviceLocales: getDeviceLocales(),
      i18n,
      preference: readPreference(),
    });
    lowdefy.i18n = { ...i18n, active };
    globals.window.__lowdefy_locale = active;
    globals.window.__lowdefy_supported_locales = i18n.locales;
    const dayjsId = i18n.locales.find((locale) => locale.code === active)?.dayjs;
    if (type.isString(dayjsId)) {
      loadDayjsLocale(dayjsId);
    }
  }

  // Applied now, not on the next render: SetLocale updates the engine straight after.
  function setPreference(code) {
    writePreference(code ?? 'auto');
    apply();
    version += 1;
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  globals.window.__lowdefy_setLocale = setPreference;

  return { apply, getVersion: () => version, setPreference, subscribe };
}

export default createShellLocale;
