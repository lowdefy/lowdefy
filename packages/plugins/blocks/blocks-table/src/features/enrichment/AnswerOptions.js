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
import { Select } from 'antd';
import resolveTagTone from '@lowdefy/block-utils/format/resolveTagTone.js';

import assignOptionColors from '@lowdefy/blocks-antd/table/assignOptionColors.js';
import OPTION_TONES from '@lowdefy/blocks-antd/table/optionTones.js';

function Swatch({ color }) {
  const tone = resolveTagTone(color);
  return (
    <span
      aria-hidden="true"
      className="lf-enrich-option-swatch"
      style={{ background: tone.color }}
    />
  );
}

const TONE_OPTIONS = OPTION_TONES.map((tone) => ({
  value: tone,
  title: tone,
  label: (
    <span className="lf-enrich-option-tone">
      <Swatch color={tone} />
      {tone}
    </span>
  ),
}));

// An AI tag answer's options (design E2): the options typed as tags, then each option as its
// chip with a colour select (preset tones only), each new option on a distinct tone.
function AnswerOptions({ onChange, options }) {
  return (
    <>
      <Select
        aria-label="Answer options"
        mode="tags"
        onChange={(values) => onChange(assignOptionColors({ values, previous: options }))}
        open={false}
        placeholder="Type an option and press Enter"
        value={options.map((option) => option.value)}
      />
      {options.length > 0 ? (
        <ul aria-label="Option colours" className="lf-enrich-options">
          {options.map((option, index) => {
            const tone = resolveTagTone(option.color);
            return (
              <li data-lf-picker-option={option.value} key={option.value}>
                <span
                  className="lf-enrich-option-chip"
                  style={{ color: tone.text, background: tone.bg, borderColor: tone.border }}
                >
                  {option.value}
                </span>
                <Select
                  aria-label={`Colour of ${option.value}`}
                  onChange={(color) => {
                    const next = [...options];
                    next[index] = { ...option, color };
                    onChange(next);
                  }}
                  options={TONE_OPTIONS}
                  popupMatchSelectWidth={false}
                  size="small"
                  value={option.color}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}

export default AnswerOptions;
