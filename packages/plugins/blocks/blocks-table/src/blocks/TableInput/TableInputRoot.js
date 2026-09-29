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

import React, { useMemo, useState } from 'react';

import normalizeChanges from '../../features/editing/normalizeChanges.js';
import TableRoot from '../../core/TableRoot.js';
import useFeatureSet from '../../core/useFeatureSet.js';

const HANDLED = { success: true };

// TableInput is the Table engine with a different value (D2): the block value is a changeset
// over `data` ({ updated, added, removed, moved?, order? }), never the rows, so a large table
// keeps a small state. The table's own UI state (sort, widths, order, selection) is kept here in
// React state instead of the block value, so the engine's value path runs unchanged against it
// and its onChange is not fired; the editing feature writes the changeset through
// `input.methods`.
function TableInputRoot(props) {
  const { methods, value } = props;
  const features = useFeatureSet({ content: {}, input: true, properties: props.properties });
  const changes = useMemo(() => normalizeChanges(value), [value]);
  const [uiValue, setUiValue] = useState(null);

  const tableMethods = useMemo(() => {
    // Object.create keeps the engine's live methods (reassigned on every render) reachable.
    const wrapped = Object.create(methods);
    wrapped.setValue = setUiValue;
    wrapped.triggerEvent = (args) =>
      args.name === 'onChange' ? HANDLED : methods.triggerEvent(args);
    return wrapped;
  }, [methods]);
  const input = useMemo(() => ({ changes, methods }), [changes, methods]);

  // The block's own props pass through; the engine reads what it needs from them.
  return React.createElement(TableRoot, {
    ...props,
    features,
    input,
    key: features.signature,
    methods: tableMethods,
    value: uiValue,
  });
}

export default TableInputRoot;
