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

import resolveToneColor from '../resolveToneColor.js';
import EmptyCell from './EmptyCell.js';

function BooleanCell({ value, column, components }) {
  if (type.isNone(value)) return <EmptyCell />;
  const { cell } = column;
  const truthy = Boolean(value);
  const label = truthy ? cell.trueLabel ?? 'Yes' : cell.falseLabel ?? 'No';
  const icon = truthy ? cell.trueIcon : cell.falseIcon;
  const customColor = truthy ? cell.trueColor : cell.falseColor;
  const color = resolveToneColor({ color: customColor, text: true });
  const className = truthy ? 'lf-table-boolean lf-table-boolean-true' : 'lf-table-boolean';
  if (!type.isNone(icon)) {
    const { Icon } = components;
    return (
      <span
        className={className}
        style={color ? { color } : undefined}
        role="img"
        aria-label={label}
        title={label}
      >
        <Icon blockId={`lf-table-boolean-${truthy}`} events={{}} properties={icon} />
      </span>
    );
  }
  return (
    <span className={className} style={color ? { color } : undefined}>
      {label}
    </span>
  );
}

export default BooleanCell;
