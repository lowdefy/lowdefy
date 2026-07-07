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
import { Picker } from 'antd-mobile';
import { type } from '@lowdefy/helpers';
import { withBlockDefaults } from '@lowdefy/block-utils';

import FieldWrapper from '../../FieldWrapper.js';
import getOptions from '../../getOptions.js';

function Selector({
  blockId,
  classNames = {},
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) {
  const [visible, setVisible] = useState(false);
  const options = getOptions(properties.options);
  const selected = options.find((option) => option.value === value);
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
      <div
        id={`${blockId}_input`}
        role="button"
        className={classNames.element}
        style={{
          border: '1px solid var(--adm-color-border)',
          borderRadius: 'var(--adm-radius-s)',
          padding: '6px 10px',
          minHeight: 36,
          color: selected ? 'var(--adm-color-text)' : 'var(--adm-color-light)',
          opacity: properties.disabled ? 0.4 : 1,
          ...styles.element,
        }}
        onClick={() => {
          if (!properties.disabled && !loading) {
            setVisible(true);
          }
        }}
      >
        {selected ? selected.label : (properties.placeholder ?? 'Select')}
      </div>
      <Picker
        columns={[options]}
        cancelText={properties.cancelText}
        confirmText={properties.confirmText}
        title={properties.pickerTitle}
        value={type.isNone(value) ? [] : [value]}
        visible={visible}
        onClose={() => setVisible(false)}
        onConfirm={(val) => {
          methods.setValue(val[0]);
          methods.triggerEvent({ name: 'onChange', event: { value: val[0] } });
        }}
      />
    </FieldWrapper>
  );
}

export default withBlockDefaults(Selector);
