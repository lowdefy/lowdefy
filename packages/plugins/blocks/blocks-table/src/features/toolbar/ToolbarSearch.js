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

import React, { useEffect, useRef, useState } from 'react';
import { Input } from 'antd';

import ToolbarIcon from './ToolbarIcon.js';

const DEBOUNCE_MS = 200;

// Writes `view.search` 200ms after typing stops (clearing applies at once). A search set from
// outside (SetState, a saved view) shows in the input unless the user is mid-edit.
function ToolbarSearch({ api, searchRef }) {
  const search = api.state.search ?? '';
  const [text, setText] = useState(search);
  const [seen, setSeen] = useState(search);
  const timer = useRef(null);
  if (seen !== search) {
    setSeen(search);
    if (timer.current === null) setText(search);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function apply(next) {
    clearTimeout(timer.current);
    timer.current = null;
    api.actions.setSearch(next);
  }

  function onChange(event) {
    const next = event.target.value;
    setText(next);
    if (next === '') {
      apply(next);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => apply(next), DEBOUNCE_MS);
  }

  return (
    <span className="lf-table-toolbar-search" data-lf-toolbar-search="">
      <Input
        allowClear
        aria-label="Search rows"
        onChange={onChange}
        placeholder="Search"
        prefix={<ToolbarIcon api={api} name="search" />}
        ref={searchRef}
        size="small"
        value={text}
      />
    </span>
  );
}

export default ToolbarSearch;
