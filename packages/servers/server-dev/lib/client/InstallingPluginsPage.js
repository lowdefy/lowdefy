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

const InstallingPluginsPage = ({ packages }) => {
  return (
    <div
      style={{
        height: '100vh',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div
        style={{
          verticalAlign: 'middle',
          display: 'inline-block',
        }}
      >
        <h3>Installing Plugin Packages</h3>
        <p>
          This page requires packages that are not yet installed:{' '}
          <strong>{(packages ?? []).join(', ')}</strong>.
        </p>
        <p>The server will restart automatically. The page will reload when ready.</p>
      </div>
    </div>
  );
};

export default InstallingPluginsPage;
