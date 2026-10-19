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

import { useRef, useState } from 'react';

import applyTransactionToRows from './applyTransactionToRows.js';

// Client mode keeps transaction results as an overlay on the rows: the table shows the
// transformed rows until the app's `data` changes, which replaces them (the app's data is the
// truth again). The rows are diffed by key already, so an engine update that re-evaluates the
// same data keeps their identity and the overlay. Refs, not render state, hold the latest rows,
// so two transactions in one tick both apply.
function useTransactionData({ api, config, rows: data }) {
  const overlay = useRef(null);
  const source = useRef(data);
  source.current = data;
  const [, setVersion] = useState(0);
  api.applyClientTransaction = (transaction) => {
    const current = overlay.current?.source === source.current ? overlay.current.rows : null;
    const result = applyTransactionToRows({
      rows: current ?? source.current,
      transaction,
      getKey: config.getKey,
    });
    overlay.current = { source: source.current, rows: result.rows };
    setVersion((version) => version + 1);
    return result.changed;
  };
  if (config.server || overlay.current?.source !== data) return data;
  return overlay.current.rows;
}

export default useTransactionData;
