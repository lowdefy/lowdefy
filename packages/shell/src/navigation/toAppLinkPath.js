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

/**
 * The page path of a link to the app's own site (a universal link or Android app link), with its
 * query: https://field.example.com/acme/tasks/42?tab=notes under basePath /acme is
 * /tasks/42?tab=notes. Any other link is returned as it is.
 *
 * @param {Object} params
 * @param {string} params.appUrl The app's url for the shell's environment.
 * @param {string} params.path The link the system opened the shell with.
 */
function toAppLinkPath({ appUrl, path }) {
  if (!/^https?:\/\//.test(path ?? '')) {
    return path;
  }
  const app = new URL(appUrl);
  const link = new URL(path);
  const basePath = app.pathname.replace(/\/$/, '');
  // Under the base path itself: /acme or /acme/..., not /acmeevil/...
  const underBasePath =
    link.pathname === basePath || link.pathname.startsWith(`${basePath}/`) || basePath === '';
  if (link.host !== app.host || !underBasePath) {
    return path;
  }
  const pagePath = link.pathname.slice(basePath.length) || '/';
  return `${pagePath.startsWith('/') ? pagePath : `/${pagePath}`}${link.search}`;
}

export default toAppLinkPath;
