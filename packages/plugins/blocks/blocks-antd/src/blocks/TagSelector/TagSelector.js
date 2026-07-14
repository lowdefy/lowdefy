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
import { cn, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import getContrastTextColor from '../../getContrastTextColor.js';

import './style.css';

// Tableau-10 categorical palette — mid-saturation hues that read on both the
// light and dark canvas.
const PALETTE = [
  '#4E79A7',
  '#F28E2B',
  '#E15759',
  '#76B7B2',
  '#59A14F',
  '#EDC948',
  '#B07AA1',
  '#FF9DA7',
  '#9C755F',
  '#BAB0AC',
];

// djb2 — tiny, deterministic string hash for stable palette assignment.
function hashString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// A multi-select input rendered as a row of toggleable tag pills. Purely
// controlled: `value` (the array of selected option values) is read from props
// each render, so SetState / onInit seeding shows up immediately. Colors are
// stable per option — an explicit option.color wins, otherwise a hash of the
// option value picks from the palette so a given value keeps the same hue on
// every render. Selected tags render filled; unselected tags are outlined with
// a hint of their hue. properties.colored: false gives single-accent pills.
const TagSelector = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) => {
  const selected = type.isArray(value) ? value : [];
  const colored = properties.colored !== false;
  const options = (properties.options || []).map((opt) =>
    type.isPrimitive(opt)
      ? { label: `${opt}`, value: opt }
      : {
          label: type.isNone(opt.label) ? `${opt.value}` : opt.label,
          value: opt.value,
          color: opt.color,
          disabled: opt.disabled,
        }
  );

  const colorFor = (opt) => {
    if (opt.color) return opt.color;
    if (!colored) return null; // single-accent mode → CSS handles the primary look
    return PALETTE[hashString(`${opt.value}`) % PALETTE.length];
  };

  const toggle = (opt) => {
    if (opt.disabled || properties.disabled || loading) return;
    const next = selected.includes(opt.value)
      ? selected.filter((v) => v !== opt.value)
      : [...selected, opt.value];
    methods.setValue(next);
    methods.triggerEvent({ name: 'onChange', event: { value: next } });
  };

  return (
    <Label
      blockId={blockId}
      methods={methods}
      classNames={classNames}
      components={{ Icon }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      styles={styles}
      validation={validation}
      content={{
        content: () => (
          <div
            id={`${blockId}_input`}
            className={cn('lf-tag-selector', classNames.element)}
            style={styles.element}
          >
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              const color = colorFor(opt);
              // Filled when selected: solid hue + black/white contrast text.
              // Outlined with a hue-tinted border when off.
              let colorStyle = {};
              if (color && isSelected) {
                colorStyle = {
                  background: color,
                  borderColor: color,
                  color: getContrastTextColor(color) || '#fff',
                };
              } else if (color) {
                colorStyle = {
                  borderColor: `color-mix(in srgb, ${color} 45%, var(--ant-color-border))`,
                };
              }
              return (
                <button
                  key={`${opt.value}`}
                  type="button"
                  disabled={opt.disabled || properties.disabled || loading}
                  aria-pressed={isSelected}
                  className={cn(
                    'lf-tag-selector-tag',
                    isSelected && 'lf-tag-selector-tag-selected',
                    classNames.tag
                  )}
                  style={{ ...colorStyle, ...styles.tag }}
                  onClick={() => toggle(opt)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ),
      }}
    />
  );
};

export default withBlockDefaults(TagSelector);
