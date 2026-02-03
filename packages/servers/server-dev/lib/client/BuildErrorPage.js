/*
  Copyright 2020-2024 Lowdefy, Inc

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

const typeColors = {
  ConfigError: '#cf1322',
  ConfigWarning: '#d48806',
  PluginError: '#531dab',
  ServiceError: '#096dd9',
  LowdefyError: '#cf1322',
};

function getTypeColor(type) {
  return typeColors[type] ?? '#595959';
}

const ErrorItem = ({ type, message, source }) => {
  const color = getTypeColor(type);
  return (
    <div
      style={{
        borderLeft: `3px solid ${color}`,
        paddingLeft: 12,
        marginBottom: 16,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {type}
      </span>
      <p style={{ fontSize: 14, margin: '4px 0' }}>{message}</p>
      {source && (
        <p style={{ fontSize: 13, color: '#8c8c8c', margin: 0 }}>{source}</p>
      )}
    </div>
  );
};

const BuildErrorPage = ({ errors, message, source }) => {
  // Support both new errors array and legacy single message/source props
  const errorList = errors ?? (message ? [{ type: 'Error', message, source }] : []);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        padding: '0 24px',
      }}
    >
      <div style={{ maxWidth: 720, width: '100%' }}>
        <h2 style={{ color: '#cf1322', marginBottom: 16 }}>
          {errorList.length > 1
            ? `Build Errors (${errorList.length})`
            : 'Build Error'}
        </h2>
        {errorList.map((err, i) => (
          <ErrorItem
            key={i}
            type={err.type}
            message={err.message}
            source={err.source}
          />
        ))}
        <p style={{ fontSize: 13, color: '#8c8c8c', marginTop: 24 }}>
          Fix the error{errorList.length > 1 ? 's' : ''} in your config and the page will rebuild
          automatically.
        </p>
      </div>
    </div>
  );
};

export default BuildErrorPage;
