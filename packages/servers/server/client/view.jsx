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

// CSS layer order — MUST be the first CSS import, as in main.jsx.
import '../build/layer-order.css';

import startView from './view/startView.jsx';

import '../build/globals.css';

// The entry of a page shown as an MCP App view. The view's loader (viewLoader
// in @lowdefy/api) runs in the host's sandbox frame, connects to the host, and
// adds this script once it holds a tool result that names a page. Where
// main.jsx reads its config and first page from the server's HTML, a view has
// only the loader's hand-over object and fetches the rest from the app.
startView({ view: window.__LOWDEFY_VIEW__, window });
