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

import React, { useCallback, useState } from 'react';

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

function formatErrorsForCopy(errors) {
  return errors
    .map((e) => {
      let text = `[${e.type}] ${e.message}`;
      if (e.source) text += `\n  Source: ${e.source}`;
      if (e.stack) text += `\n${e.stack}`;
      return text;
    })
    .join('\n\n');
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const ErrorBar = ({ errors }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = formatErrorsForCopy(errors);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [errors]);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
        {count > 1 && (
          <span
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderRadius: 8,
              padding: '1px 7px',
              fontSize: 11,
            }}
          >
            {count}
          </span>
        )}
        <button
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy all errors'}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            opacity: copied ? 1 : 0.7,
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  );
};

export default ErrorBar;
