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

// Shared fake-input trigger for the picker blocks (Selector, DateSelector) —
// antd-mobile pickers have no input-styled trigger of their own.
function PickerTrigger({ blockId, classNames = {}, disabled, hasValue, label, onOpen, styles = {} }) {
  return (
    <div
      id={`${blockId}_input`}
      role="button"
      className={classNames.element}
      style={{
        boxSizing: 'border-box',
        border: '1px solid var(--adm-color-border)',
        borderRadius: 'var(--adm-radius-s)',
        padding: '6px 10px',
        minHeight: 36,
        color: hasValue ? 'var(--adm-color-text)' : 'var(--adm-color-light)',
        opacity: disabled ? 0.4 : 1,
        ...styles.element,
      }}
      onClick={() => {
        if (!disabled) {
          onOpen();
        }
      }}
    >
      {label}
    </div>
  );
}

export default PickerTrigger;
