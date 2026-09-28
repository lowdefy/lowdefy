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
      return { success: true };
    },
  }));
  return (
    <Table
      blockId="bench_table"
      components={{ Icon: () => null, Link: 'a' }}
      methods={methods}
      properties={{ columns, data, height: 800, ...properties }}
      rowWindowStrategy={strategy}
      value={value}
    />
  );
}

export default BenchTable;
