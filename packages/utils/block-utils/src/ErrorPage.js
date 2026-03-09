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

const fontFamily =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const ErrorPage = ({ code, description, message, name }) => (
  <div
    style={{
      height: '100vh',
      fontFamily,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0 24px',
    }}
  >
    <div
      style={{
        fontSize: '4.3em',
        fontWeight: '100',
        marginBottom: 16,
      }}
    >
      {code ?? 500}
    </div>
    <div
      style={{
        fontSize: '1.3em',
        fontWeight: '300',
        marginBottom: 8,
      }}
    >
      {name ?? 'Error'}
    </div>
    <div style={{ fontSize: '0.9em', color: '#595959', maxWidth: 400 }}>
      {message ?? 'An error has occurred.'}
    </div>
    {description && (
      <div style={{ fontSize: '0.9em', color: '#595959', maxWidth: 400, marginTop: 4 }}>
        {description}
      </div>
    )}
    <div style={{ marginTop: 24 }}>
      <a
        href="/"
        style={{
          color: '#1890ff',
          textDecoration: 'none',
        }}
      >
        Return to home page
      </a>
    </div>
  </div>
);

export default ErrorPage;
