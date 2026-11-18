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

// The URL a view opens in the browser for a navigation the app answered with
// no page, or null when there is nothing to open. The app serves a view its
// view pages only and answers any other page of the app as one for another
// surface (a 404 that names the page's surface): that page is opened at its
// absolute URL on the app's origin. A path that names no page is not opened,
// and neither is a page for phones only, which the browser has no URL for.
function getBrowserUrl({ fetched, location, origin }) {
  if (fetched.status !== 404 || typeof fetched.surface !== 'string') {
    return null;
  }
  if (fetched.surface === 'mobile') {
    return null;
  }
  return `${origin}${location.pathname}${location.search}`;
}

export default getBrowserUrl;
