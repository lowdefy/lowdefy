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

function getBarStyle(errors) {
  const hasError = errors.some((e) => e.type !== 'ConfigWarning');
  return {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: hasError ? '#cf1322' : '#d48806',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 12,
    lineHeight: '14px',
    zIndex: 99999,
    boxShadow: '0 -1px 4px rgba(0,0,0,0.15)',
  };
}

const ErrorBar = ({ errors }) => {
  if (!errors || errors.length === 0) return null;

  const latest = errors[errors.length - 1];
  const count = errors.length;

  return (
    <div style={getBarStyle(errors)}>
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
        }}
      >
        <span style={{ opacity: 0.8 }}>{latest.type}: </span>
        <span>{latest.message}</span>
        {latest.source && <span style={{ opacity: 0.7, marginLeft: 8 }}>{latest.source}</span>}
      </div>
      {count > 1 && (
        <span
          style={{
            marginLeft: 12,
            backgroundColor: 'rgba(255,255,255,0.25)',
            borderRadius: 8,
            padding: '1px 7px',
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
};

export default ErrorBar;
