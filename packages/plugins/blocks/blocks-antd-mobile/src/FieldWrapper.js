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
import { type } from '@lowdefy/helpers';
import { renderHtml } from '@lowdefy/block-utils';

// Shared label + validation chrome for input blocks. Not a block itself —
// antd-mobile has no Label idiom like antd's Form.Item, so inputs render
// their own title and validation message.
function FieldWrapper({ blockId, children, classNames = {}, methods, properties, required, styles = {}, validation = {} }) {
  const label = properties.label ?? {};
  const title = type.isNone(label.title) ? properties.title : label.title;
  const showLabel = label.disabled !== true && !type.isNone(title);
  return (
    <div id={blockId} className={classNames.block} style={styles.block}>
      {showLabel && (
        <label
          htmlFor={`${blockId}_input`}
          className={classNames.label}
          style={{
            display: 'block',
            fontSize: 'var(--adm-font-size-7)',
            color: 'var(--adm-color-text-secondary)',
            marginBottom: 4,
            ...styles.label,
          }}
        >
          {renderHtml({ html: title, methods })}
          {required && <span style={{ color: 'var(--adm-color-danger)' }}> *</span>}
        </label>
      )}
      {children}
      {validation.status === 'error' && (
        <div
          className={classNames.validation}
          style={{
            fontSize: 'var(--adm-font-size-6)',
            color: 'var(--adm-color-danger)',
            marginTop: 4,
            ...styles.validation,
          }}
        >
          {validation.errors?.[0]}
        </div>
      )}
    </div>
  );
}

export default FieldWrapper;
