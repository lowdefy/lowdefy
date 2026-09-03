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

import formatErrorsForCopy from './utils/formatErrorsForCopy.js';
import getErrorBarColor from './utils/getErrorBarColor.js';
import groupNotices from './utils/groupNotices.js';
import selectBarEntry from './utils/selectBarEntry.js';

function getBarStyle(errors) {
  return {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: getErrorBarColor(errors),
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

  // The entry the bar colour was chosen from, not simply the newest one: the
  // "fails in prod" badge below belongs to the entry being shown.
  const latest = selectBarEntry(errors);
  // tenant: none notices are counted as their own group beside the error
  // count, so an unscoped read never hides inside an error total.
  const { entries, tenantNotices, runAsNotices } = groupNotices(errors);
  const count = entries.length;

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
        {latest.prodError === true && (
          <span
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderRadius: 8,
              padding: '1px 7px',
              fontSize: 11,
              marginRight: 6,
            }}
          >
            fails in prod
          </span>
        )}
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
        {tenantNotices.length > 0 && (
          <span
            title="Requests that ran with tenant: none read and write rows of every organization"
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderRadius: 8,
              padding: '1px 7px',
              fontSize: 11,
              whiteSpace: 'nowrap',
            }}
          >
            unscoped reads ({tenantNotices.length})
          </span>
        )}
        {runAsNotices.length > 0 && (
          <span
            title="Steps that ran scoped to an organization declared with runAs"
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderRadius: 8,
              padding: '1px 7px',
              fontSize: 11,
              whiteSpace: 'nowrap',
            }}
          >
            scoped runs ({runAsNotices.length})
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
