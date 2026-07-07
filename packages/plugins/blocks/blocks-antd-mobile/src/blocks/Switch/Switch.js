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
import { Switch } from 'antd-mobile';
import { withBlockDefaults } from '@lowdefy/block-utils';

import FieldWrapper from '../../FieldWrapper.js';

function SwitchBlock({
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
      <Switch
        className={classNames.element}
        style={styles.element}
        checked={value === true}
        checkedText={properties.checkedText}
        uncheckedText={properties.uncheckedText}
        disabled={properties.disabled || loading}
        onChange={
          onChange ||
          ((checked) => {
            methods.setValue(checked);
            methods.triggerEvent({ name: 'onChange', event: { value: checked } });
          })
        }
      />
    </FieldWrapper>
  );
}

export default withBlockDefaults(SwitchBlock);
