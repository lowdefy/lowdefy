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

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { type } from '@lowdefy/helpers';
import { functionalUpdate } from '@tanstack/react-table';

import createInitialState from './createInitialState.js';
import deriveValue from './deriveValue.js';
import features from '../features/index.js';
import getValueSignature from './getValueSignature.js';
import isSameSignature from './isSameSignature.js';
import resolveMountValue from './resolveMountValue.js';
import sliceDefinitions from './sliceDefinitions.js';

// Table state is the single source: one React state object holding every TanStack slice plus the
// core's own (density, view passthrough, expanded). The block value is derived from it and written
// with methods.setValue only after a committed change (sort, resize end, drop, selection). A value
// that changes from outside (SetState, Reset) re-initialises the state; a null value (mount, Reset
// to empty) is filled with the resolved default value without an onChange event. On mount only, a
// null value may come from a feature instead (a persisted or saved view, `mountValue`).
function useTableState({ api, config, data, methods, properties, value }) {
  const [state, setState] = useState(() =>
    createInitialState({
      value: resolveMountValue({ value, config, properties }),
      config,
      rows: data,
    })
  );
  const [isPending, startTransition] = useTransition();
  const written = useRef(null);
  const pendingCause = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const signature = getValueSignature(value);
  const [synced, setSynced] = useState({ signature, config });
  if (!isSameSignature(synced.signature, signature) || synced.config !== config) {
    setSynced({ signature, config });
    if (synced.config !== config || !isSameSignature(signature, written.current)) {
      setState(createInitialState({ value, config, rows: data }));
    }
  }

  const updateSlice = useCallback((name, updater, options) => {
    const definition = sliceDefinitions[name];
    pendingCause.current = options?.cause ?? definition.cause;
    function apply() {
      setState((previous) => {
        let next = functionalUpdate(updater, previous[name]);
        if (definition.normalize) next = definition.normalize({ next, api });
        return next === previous[name] ? previous : { ...previous, [name]: next };
      });
    }
    if (definition.transition) {
      startTransition(apply);
    } else {
      apply();
    }
  }, []);

  const setSliceSilently = useCallback((name, updater) => {
    setState((previous) => {
      const next = functionalUpdate(updater, previous[name]);
      return next === previous[name] ? previous : { ...previous, [name]: next };
    });
  }, []);

  // Replaces the whole state from a value (a saved view loading), then commits it with this cause.
  const loadValue = useCallback((nextValue, options) => {
    pendingCause.current = options.cause;
    setState(createInitialState({ value: nextValue, config: api.config, rows: dataRef.current }));
  }, []);

  const commit = useCallback(
    (cause) => {
      const nextValue = deriveValue({ state: api.state, api });
      written.current = getValueSignature(nextValue);
      methods.setValue(nextValue);
      if (cause === 'init') return;
      methods.triggerEvent({ name: 'onChange', event: { value: nextValue, cause } });
      features.forEach((feature) => feature.onCommit?.({ cause, value: nextValue, api }));
    },
    [methods]
  );

  useEffect(() => {
    const cause = pendingCause.current;
    if (!cause) return;
    pendingCause.current = null;
    commit(cause);
  }, [state]);

  useEffect(() => {
    if (type.isNone(value)) commit('init');
  }, [value]);

  return { isPending, loadValue, setSliceSilently, state, updateSlice };
}

export default useTableState;
