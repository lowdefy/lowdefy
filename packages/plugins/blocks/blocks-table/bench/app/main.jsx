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

import React, { Profiler, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { App, ConfigProvider } from 'antd';

import RenderProbeContext from '../../dist/core/RenderProbeContext.js';
import createSortKeyGetter from '@lowdefy/blocks-antd/table/createSortKeyGetter.js';
import compileCondition from '@lowdefy/blocks-antd/table/compileCondition.js';
import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';

import buildSortKeys from '../../dist/features/sorting/buildSortKeys.js';
import pruneCondition from '../../dist/features/filtering/pruneCondition.js';
import createAccessor from '../../dist/core/createAccessor.js';
import BenchTable from './BenchTable.jsx';
import generateData from './generateData.js';

const probe = {
  body: () => {
    window.__bench.renders.body += 1;
  },
  row: (rowKey) => {
    window.__bench.renders.rows += 1;
    window.__bench.renders.rowKeys.push(rowKey);
  },
};

let setHarness = null;

function Harness() {
  const [harness, set] = useState(null);
  const methodsRef = useRef({});
  setHarness = set;
  window.__bench.methods = methodsRef.current;
  if (!harness) return null;
  return (
    <ConfigProvider theme={{ cssVar: { key: 'lowdefy' }, hashed: false }}>
      <App>
        <RenderProbeContext.Provider value={probe}>
          <Profiler
            id="table"
            onRender={(id, phase, actualDuration) => {
              window.__bench.commits.push({ phase, actualDuration });
            }}
          >
            <BenchTable
              columns={harness.columns}
              data={harness.data}
              key={harness.mountKey}
              methodsRef={methodsRef}
              properties={harness.properties}
              strategy={harness.strategy}
            />
          </Profiler>
        </RenderProbeContext.Provider>
      </App>
    </ConfigProvider>
  );
}

function nextFrames(count = 2) {
  return new Promise((resolve) => {
    let remaining = count;
    function tick() {
      remaining -= 1;
      if (remaining <= 0) {
        resolve(performance.now());
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

window.__bench = {
  commits: [],
  events: [],
  renders: { body: 0, rows: 0, rowKeys: [] },
  setValueCount: 0,
  generate({ rows, cols, seed }) {
    const started = performance.now();
    window.__bench.dataset = generateData({ rows, cols, seed });
    return performance.now() - started;
  },
  async mount({ properties = {}, strategy } = {}) {
    const { columns, data } = window.__bench.dataset;
    const started = performance.now();
    flushSync(() => setHarness({ columns, data, mountKey: Math.random(), properties, strategy }));
    const committed = performance.now();
    const painted = await nextFrames(2);
    return { commitMs: committed - started, paintMs: painted - started };
  },
  resetCounters() {
    window.__bench.commits = [];
    window.__bench.events = [];
    window.__bench.renders = { body: 0, rows: 0, rowKeys: [] };
    window.__bench.setValueCount = 0;
  },
  async updateRow(index) {
    const { columns, data } = window.__bench.dataset;
    const next = data.slice();
    next[index] = { ...data[index], [columns[1].key]: `Updated ${performance.now()}` };
    window.__bench.dataset = { columns, data: next };
    const started = performance.now();
    flushSync(() => setHarness((previous) => ({ ...previous, data: next })));
    const committed = performance.now();
    await nextFrames(2);
    return { commitMs: committed - started };
  },
  sortKeysMicro({ key }) {
    const { columns, data } = window.__bench.dataset;
    const column = normalizeColumns({
      columns: [columns.find((entry) => entry.key === key)],
    }).columns[0];
    const rows = data.map((original) => ({ original }));
    const started = performance.now();
    buildSortKeys({
      rows,
      accessor: createAccessor(key),
      getSortKey: createSortKeyGetter({ column }),
      columnType: column.type,
    });
    return performance.now() - started;
  },
  // The client filter row model's work on its own: compile the condition once, test every row.
  filterMicro({ filter }) {
    const { columns, data } = window.__bench.dataset;
    const columnsByKey = {};
    columns.forEach((column) => {
      columnsByKey[column.key] = { ...column, field: column.key };
    });
    const started = performance.now();
    const matches = compileCondition({ condition: pruneCondition(filter), columnsByKey });
    let count = 0;
    for (let i = 0; i < data.length; i++) if (matches(data[i])) count += 1;
    window.__bench.lastFilterCount = count;
    return performance.now() - started;
  },
  nextFrames,
};

createRoot(document.getElementById('root')).render(<Harness />);
