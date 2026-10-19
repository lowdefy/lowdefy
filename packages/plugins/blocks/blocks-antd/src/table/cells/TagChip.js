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

// One tag: a plain span coloured with its tone (getTagTone) through CSS variables, so a cell
// costs one element per tag and no antd component.
function TagChip({ label, tone, icon, components }) {
  const { Icon } = components;
  const style = {
    '--lf-table-tone-text': tone.text,
    '--lf-table-tone-bg': tone.bg,
    '--lf-table-tone-border': tone.border,
  };
  return (
    <span className="lf-table-tag" style={style}>
      {!type.isNone(icon) && <Icon blockId="lf-table-tag-icon" events={{}} properties={icon} />}
      {label}
    </span>
  );
}

export default TagChip;
