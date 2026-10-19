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

import { useRef } from 'react';

// Config objects (columns, defaultView, rowSelection, ...) are small but the engine hands the
// block a fresh copy whenever any property is re-evaluated. Comparing their JSON keeps downstream
// memos (column model, TanStack column defs) from rebuilding for identical config. Never use this
// for `data`, which is diffed by row key instead.
function useStableConfig(value) {
  const ref = useRef({ json: undefined, value: undefined });
  const json = JSON.stringify(value ?? null);
  if (ref.current.json !== json) {
    ref.current = { json, value };
  }
  return ref.current.value;
}

export default useStableConfig;
