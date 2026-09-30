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
import { Input, Popover } from 'antd';
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

function TonePalette({ color, onPick, value }) {
  return (
    <div aria-label={`Colours for ${value}`} className="lf-enrich-option-palette" role="group">
      {OPTION_TONES.map((tone) => (
        <button
          aria-label={tone}
          aria-pressed={tone === color}
          className="lf-enrich-option-palette-tone"
          data-lf-option-tone={tone}
          key={tone}
          onClick={() => onPick(tone)}
          title={tone}
          type="button"
        >
          <Swatch color={tone} />
        </button>
      ))}
    </div>
  );
}

// One option: its chip in its tone, with the colour button (a popover of preset tones) before
// the text and a remove button after it.
function OptionChip({ onColor, onRemove, option }) {
  const [open, setOpen] = useState(false);
  const tone = resolveTagTone(option.color);
  return (
    <li
      className="lf-enrich-option-chip"
      data-color={option.color}
      data-lf-picker-option={option.value}
      style={{ color: tone.text, background: tone.bg, borderColor: tone.border }}
    >
      <Popover
        arrow={false}
        content={
          <TonePalette
            color={option.color}
            onPick={(color) => {
              setOpen(false);
              onColor(color);
            }}
            value={option.value}
          />
        }
        onOpenChange={setOpen}
        open={open}
        placement="bottomLeft"
        trigger="click"
      >
        <button
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={`Colour of ${option.value}: ${option.color}`}
          className="lf-enrich-option-color"
          title={option.color}
          type="button"
        >
          <Swatch color={option.color} />
        </button>
      </Popover>
      <span className="lf-enrich-option-text">{option.value}</span>
      <button
        aria-label={`Remove ${option.value}`}
        className="lf-enrich-option-remove"
        onClick={onRemove}
        type="button"
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  );
}

// An AI tag answer's options (design E2) in one control: each option is a chip in its colour,
// with a colour button (preset tones only) and a remove button, and the input after them adds
// one on Enter (Backspace in the empty input removes the last). A new option takes the first
// tone no other option uses (assignOptionColors).
function AnswerOptions({ onChange, options }) {
  const [text, setText] = useState('');
  const values = options.map((option) => option.value);
  const add = () => {
    const value = text.trim();
    setText('');
    if (value === '' || values.includes(value)) return;
    onChange(assignOptionColors({ values: [...values, value], previous: options }));
  };
  const remove = (index) => onChange(options.filter((_, i) => i !== index));
  return (
    <div className="lf-enrich-options" data-lf-answer-options="">
      {options.length > 0 ? (
        <ul aria-label="Answer option list" className="lf-enrich-options-list">
          {options.map((option, index) => (
            <OptionChip
              key={option.value}
              onColor={(color) => {
                const next = [...options];
                next[index] = { ...option, color };
                onChange(next);
              }}
              onRemove={() => remove(index)}
              option={option}
            />
          ))}
        </ul>
      ) : null}
      <Input
        aria-label="Answer options"
        className="lf-enrich-options-input"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Backspace' && text === '' && options.length > 0) {
            remove(options.length - 1);
          }
        }}
        onPressEnter={(event) => {
          // Enter adds the option; it never submits the picker.
          event.preventDefault();
          add();
        }}
        placeholder="Type an option and press Enter"
        value={text}
        variant="borderless"
      />
    </div>
  );
}

export default AnswerOptions;
