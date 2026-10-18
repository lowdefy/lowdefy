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

// Properties the native inputs share with the web inputs, under the same names.

export const allowClear = {
  type: 'boolean',
  description: 'Show a button that clears the input.',
};

export const autoFocus = {
  type: 'boolean',
  default: false,
  description: 'Focus the input when the page opens.',
};

export const bordered = {
  type: 'boolean',
  default: true,
  description:
    "Whether the input has a border. Deprecated, use variant instead; bordered: false renders the input as 'borderless'.",
};

export const disabled = {
  type: 'boolean',
  default: false,
  description: 'Disable the input.',
};

export const inputTitle = {
  type: 'string',
  description:
    'Title to describe the input. If no title is specified the block id is displayed. Shown as plain text on mobile.',
};

export const placeholder = {
  type: 'string',
  description: 'Placeholder text shown while the input is empty.',
};

export const prefix = {
  type: 'string',
  description: 'Text shown before the value.',
};

export const sizeSmallDefaultLarge = {
  type: 'string',
  enum: ['small', 'default', 'large'],
  default: 'default',
  description: 'Size of the input.',
};

export const sizeSmallMiddleLarge = {
  type: 'string',
  enum: ['small', 'middle', 'large'],
  default: 'middle',
  description: 'Size of the input.',
};

export const suffix = {
  type: 'string',
  description: 'Text shown after the value.',
};

export const theme = {
  type: 'object',
  description:
    'Antd design token overrides for this block. On mobile an override applies where the block reads a token of the same name, such as colorPrimary, colorText, colorBorder, borderRadius or fontSize.',
};

export const variant = {
  type: 'string',
  enum: ['outlined', 'filled', 'borderless', 'underlined'],
  description: 'Input visual variant.',
};

export const webIcon = {
  type: ['string', 'object'],
  description: 'Ignored on mobile.',
};
