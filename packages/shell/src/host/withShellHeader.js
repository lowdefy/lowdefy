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

// Every call a shell makes carries x-lowdefy-shell, its version: the server serves mobile pages
// only to shells and web pages only to browsers.
function withShellHeader({ fetch, shellVersion }) {
  return function shellHeaderFetch(url, init = {}) {
    return fetch(url, { ...init, headers: { ...init.headers, 'x-lowdefy-shell': shellVersion } });
  };
}

export default withShellHeader;
