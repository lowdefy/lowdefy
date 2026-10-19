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

const PATHS = {
  // A clock: queued.
  queued: (
    <>
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  // An exclamation mark in a disc: error.
  error: (
    <>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M8 4v5" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="8" cy="11.75" r="1" fill="#fff" />
    </>
  ),
  // A circular arrow: rerun a stale cell.
  rerun: (
    <path
      d="M13 8a5 5 0 1 1-1.46-3.54M13 2.5v3h-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  // A play triangle: run a row.
  run: <path d="M5 3.5v9l7.5-4.5z" fill="currentColor" />,
  // A plus: add a column.
  add: <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
};

// The enrichment module's static icons, inline SVG so the cells that show them stay tier 0 (no
// icon component, no antd).
function RunIcon({ name }) {
  return (
    <svg aria-hidden="true" className="lf-enrich-icon" focusable="false" viewBox="0 0 16 16">
      {PATHS[name]}
    </svg>
  );
}

export default RunIcon;
