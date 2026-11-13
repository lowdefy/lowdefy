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

// The window the engine and its plugins reach in a view: the frame's window
// with the view's location in place of the frame's own, and an open that asks
// the host to open the link. A window method loses
// its receiver when it is read through another object, so methods are bound to
// the real window; constructors (URL, WebSocket) are handed over as they are.
function createViewWindow({ location, open, window }) {
  return new Proxy(
    {},
    {
      get: (_, key) => {
        if (key === 'location') {
          return location;
        }
        if (key === 'open') {
          return open;
        }
        const value = window[key];
        if (typeof value === 'function' && !('prototype' in value)) {
          return value.bind(window);
        }
        return value;
      },
      has: (_, key) => key in window,
      set: (_, key, value) => {
        window[key] = value;
        return true;
      },
    }
  );
}

export default createViewWindow;
