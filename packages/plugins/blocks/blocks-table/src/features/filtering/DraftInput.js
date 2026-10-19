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
import { Input } from 'antd';

import useDraft from './useDraft.js';

// A text input whose value applies after a pause, on Enter or on blur.
function DraftInput({
  'aria-label': ariaLabel,
  autoFocus,
  className,
  onChange,
  placeholder,
  size,
  value,
}) {
  const { draft, setDraft, flush } = useDraft({ value, onChange });
  return (
    <Input
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      className={className}
      placeholder={placeholder}
      size={size}
      allowClear
      onBlur={flush}
      onChange={(event) => setDraft(event.target.value === '' ? undefined : event.target.value)}
      onPressEnter={flush}
      value={draft ?? ''}
    />
  );
}

export default DraftInput;
