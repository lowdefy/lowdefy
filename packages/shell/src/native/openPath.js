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

import { type } from '@lowdefy/helpers';

/**
 * Opens one of the app's pages by path, as a notification tap, a shortcut, a widget or a share
 * does: "/tasks/42?tab=notes", with a query object merged into the path's own.
 *
 * @param {Object} params
 * @param {Object} params.app The open app (currentApp.js).
 * @param {string} params.path
 * @param {Object} [params.query]
 */
function openPath({ app, path, query }) {
  if (!type.isString(path) || !path.startsWith('/')) {
    return;
  }
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    params.set(key, type.isString(value) ? value : JSON.stringify(value));
  });
  const queryString = params.toString();
  app.router.push({ pathname, query: queryString === '' ? undefined : queryString });
}

export default openPath;
