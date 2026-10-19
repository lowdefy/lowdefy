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

// CSS layer order — MUST be the first CSS import. This locks the cascade
// priority (antd > base/preflight) before antd's StyleProvider injects
// @layer antd {} at runtime. Vite's PostCSS pipeline compiles globals.css
// (Tailwind) on the fly and hot-replaces it — the old tailwind-jit.css
// side-channel is gone.
import '../build/layer-order.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import createRouter from '@lowdefy/client/adapters/createRouter.js';

import App from './App.jsx';

import '../build/globals.css';

const config = JSON.parse(document.getElementById('__LOWDEFY_CONFIG__').textContent);
const router = createRouter({ basePath: config.basePath ?? '', window });
const container = document.getElementById('root');

// Keep one React root across Vite HMR updates.
const root = import.meta.hot?.data.root ?? createRoot(container);
if (import.meta.hot) {
  import.meta.hot.data.root = root;
}

root.render(<App config={config} router={router} />);
