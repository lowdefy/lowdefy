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

import React from 'react';
import { createRoot } from 'react-dom/client';

import 'antd-mobile/es/global';
import 'build/mobile/theme.css';

import App from './App.jsx';

// Baked in at build time: the remote server origin in production bundles,
// empty in dev where /api is proxied by the Vite dev server (same-origin).
const apiBase = __LOWDEFY_MOBILE_SERVER_URL__;

const container = document.getElementById('root');
const root = import.meta.hot?.data.root ?? createRoot(container);
if (import.meta.hot) {
  import.meta.hot.data.root = root;
}

async function fetchRootConfig() {
  const res = await fetch(`${apiBase}/api/root?target=mobile`);
  if (!res.ok) {
    throw new Error(`Failed to fetch root config. Received status ${res.status}.`);
  }
  return res.json();
}

async function fetchSession() {
  // Returns 404 when auth is not configured; treat any failure as no session.
  try {
    const res = await fetch(`${apiBase}/api/auth/session`);
    if (!res.ok) return null;
    const session = await res.json();
    return session && Object.keys(session).length > 0 ? session : null;
  } catch {
    return null;
  }
}

async function boot() {
  try {
    const [rootConfig, session] = await Promise.all([fetchRootConfig(), fetchSession()]);
    root.render(<App apiBase={apiBase} rootConfig={rootConfig} session={session} />);
  } catch (error) {
    console.error(error);
    root.render(
      <div style={{ padding: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h3>Could not connect</h3>
        <p>The app could not reach its server. Check your connection and try again.</p>
      </div>
    );
  }
}

boot();
