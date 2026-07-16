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
import { cn } from '@lowdefy/block-utils';

import Label from './blocks/Label/Label.js';
import getTagColor from './getTagColor.js';
import getContrastTextColor from './getContrastTextColor.js';

import './tagSelectorStyle.css';

// Shared body for TagSelector (single) and TagMultipleSelector (multi): the
// input Label wrapping a row of toggleable tag pills. Value semantics differ
// between the two blocks, so selection state and toggling are injected as
// `isSelected` / `onToggle`; everything visual — stable per-value colors,
// filled-selected / outlined-unselected pills, per-option and whole-block
// disabling — lives here so both blocks render identically. Colors are stable
// per option (see getTagColor); `properties.colored: false` gives single-accent
// pills that use the primary color.
function TagPillRow({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  isSelected,
  loading,
  methods,
  onToggle,
  options,
  properties,
  required,
  styles = {},
  validation,
}) {
  const colored = properties.colored !== false;
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
              const selected = isSelected(opt.value);
              const color = getTagColor({ option: opt, colored });
              // Filled when selected: solid hue + black/white contrast text.
              // Outlined with a hue-tinted border when off.
              let colorStyle = {};
              if (color && selected) {
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
                  aria-pressed={selected}
                  className={cn(
                    'lf-tag-selector-tag',
                    selected && 'lf-tag-selector-tag-selected',
                    classNames.tag
                  )}
                  style={{ ...colorStyle, ...styles.tag }}
                  onClick={() => onToggle(opt)}
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
}

export default TagPillRow;
