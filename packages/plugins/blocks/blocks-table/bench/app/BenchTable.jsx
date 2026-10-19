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

import React, { useState } from 'react';

import Table from '../../dist/blocks/Table/Table.lazy.js';

// Stand-ins for the Lowdefy client's components: an anchor for Link (the client's Link adds router
// navigation on click) and no icons.
function BenchLink({ children, className, onClick, pageId, urlQuery }) {
  const query = new URLSearchParams(urlQuery ?? {}).toString();
  return (
    <a className={className} href={`/${pageId}${query ? `?${query}` : ''}`} onClick={onClick}>
      {children}
    </a>
  );
}

const components = { Icon: () => null, Link: BenchLink };

// Server mode's `__tableFetch` answered from the generated rows after `window.__bench.latencyMs`
// (default 50 ms, the server-mode scenario of performance.md §8), in the Request action's result
// shape.
function answerFetch({ startRow, endRow }) {
  const { data } = window.__bench.dataset;
  window.__bench.fetches += 1;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        responses: {
          __tableFetch: { response: [{ rows: data.slice(startRow, endRow), total: data.length }] },
        },
      });
    }, window.__bench.latencyMs ?? 50);
  });
}

// Mounts the Table implementation with engine-shaped props: setValue feeds the value back as the
// `value` prop with its identity kept, as the Lowdefy engine does.
function BenchTable({ columns, data, methodsRef, properties, strategy }) {
  const [value, setValue] = useState(null);
  const [methods] = useState(() => ({
    registerEvent: () => undefined,
    registerMethod: (name, fn) => {
      methodsRef.current[name] = fn;
    },
    setValue: (next) => {
      window.__bench.setValueCount += 1;
      setValue(next);
    },
    triggerEvent: ({ name, event }) => {
      window.__bench.events.push({ name, event });
      if (name === '__tableFetch') return answerFetch(event);
      return { success: true };
    },
  }));
  return (
    <Table
      blockId="bench_table"
      components={components}
      methods={methods}
      properties={{ columns, data, height: 800, ...properties }}
      rowWindowStrategy={strategy}
      value={value}
    />
  );
}

export default BenchTable;
