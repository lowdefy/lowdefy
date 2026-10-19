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

import { useEffect, useRef } from 'react';
import { type } from '@lowdefy/helpers';

import processColDefs from './processColDefs.js';

// Fingerprint the authored columnDefs, functions included. JSON.stringify drops
// function values unless a replacer returns something for them, and a cellRenderer or
// valueGetter built by an operator is a new function on every evaluation — so identity
// is the only signal available that one of them changed.
function fingerprint(columnDefs) {
  const functions = [];
  const json = JSON.stringify(columnDefs, (_key, value) => {
    if (type.isFunction(value)) {
      functions.push(value);
      return `__fn__${functions.length - 1}`;
    }
    return value;
  });
  return { json, functions };
}

function unchanged(previous, next) {
  if (!previous) return false;
  if (previous.json !== next.json) return false;
  if (previous.functions.length !== next.functions.length) return false;
  return previous.functions.every((fn, index) => fn === next.functions[index]);
}

// Cell renderers keep their identity across renders (see processColDefs), which is
// what stops ag-grid destroying a cell mid-interaction — but it also means nothing
// replaces a cell when its column definition changes. ag-grid refreshes body cells on
// a data change; it does not listen for colDefChanged. So ask it: refreshCells
// re-renders the mounted cells in place with the new definition. It passes
// `newData: false`, so React keeps the instances, and with them whatever the cell
// was holding.
function useColDefs({ columnDefs, methods, components, gridRef }) {
  const cache = useRef(new Map());
  const previous = useRef();
  const processed = processColDefs(columnDefs, methods, components, cache.current);
  useEffect(() => {
    const next = fingerprint(columnDefs);
    const first = previous.current === undefined;
    const same = unchanged(previous.current, next);
    previous.current = next;
    if (first || same) return;
    gridRef.current?.api?.refreshCells({ force: true });
  });
  return processed;
}

export default useColDefs;
