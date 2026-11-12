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

// A window.location for a view: the view's address, on the app's origin. The
// frame's own location is the host's sandbox origin and names no page. The
// path and query are read from the router each time they are asked for.
//
// A view cannot leave its frame, so assign and replace hand the URL to openUrl
// (the host opens it in the browser), and reload is the host's to carry out.
function createViewLocation({ openUrl, origin, reload, router }) {
  const { host, hostname, port, protocol } = new URL(origin);
  const location = {
    assign: (url) => openUrl(new URL(url, origin).href),
    hash: '',
    host,
    hostname,
    get href() {
      const { pathname, search } = router.getLocation();
      return `${origin}${pathname}${search}`;
    },
    origin,
    get pathname() {
      return router.getLocation().pathname;
    },
    port,
    protocol,
    reload,
    replace: (url) => openUrl(new URL(url, origin).href),
    get search() {
      return router.getLocation().search;
    },
    toString: () => location.href,
  };
  return location;
}

export default createViewLocation;
