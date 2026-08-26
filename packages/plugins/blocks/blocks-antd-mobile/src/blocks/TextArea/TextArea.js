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
import { TextArea } from 'antd-mobile';
import { withBlockDefaults } from '@lowdefy/block-utils';

import FieldWrapper from '../../FieldWrapper.js';

function TextAreaBlock({
  blockId,
  classNames = {},
  loading,
  methods,
  onChange,
  properties,
  required,
  styles = {},
  validation,
  value,
}) {
  return (
    <FieldWrapper
      blockId={blockId}
      classNames={classNames}
      methods={methods}
      properties={properties}
      required={required}
      styles={styles}
      validation={validation}
    >
      <TextArea
        id={`${blockId}_input`}
        className={classNames.element}
        style={{
          // border-box: adm-text-area is width 100% and this inline padding
          // would otherwise overflow the field wrapper.
          boxSizing: 'border-box',
          border: '1px solid var(--adm-color-border)',
          borderRadius: 'var(--adm-radius-s)',
          padding: '6px 10px',
          ...styles.element,
        }}
        autoSize={properties.autoSize}
        disabled={properties.disabled || loading}
        maxLength={properties.maxLength}
        placeholder={properties.placeholder}
        rows={properties.rows}
        showCount={properties.showCount}
        value={value ?? ''}
        onChange={
          onChange ||
          ((input) => {
            methods.setValue(input);
            methods.triggerEvent({ name: 'onChange', event: { value: input } });
          })
        }
      />
    </FieldWrapper>
  );
}

export default withBlockDefaults(TextAreaBlock);
