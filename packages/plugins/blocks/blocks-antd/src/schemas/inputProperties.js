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

export const disabled = {
  type: 'boolean',
  default: false,
  description: 'Disable the block if true.',
};

export const placeholder = {
  type: 'string',
  description: 'Placeholder text inside the block before user types input.',
};

export const inputTitle = {
  type: 'string',
  description:
    'Title to describe the input component, if no title is specified the block id is displayed - supports html.',
};

export const autoFocus = {
  type: 'boolean',
  default: false,
  description: 'Autofocus to the block on page load.',
};

export const variant = {
  type: 'string',
  enum: ['outlined', 'filled', 'borderless'],
  description: 'Input visual variant. When set, takes precedence over bordered.',
};

export const bordered = {
  type: 'boolean',
  default: true,
  description: 'Whether or not the input has a border style. Deprecated, use variant instead.',
};

export const allowClear = {
  type: 'boolean',
  description: 'Allow the user to clear their input.',
};

export const sizeSmallMiddleLarge = {
  type: 'string',
  enum: ['small', 'middle', 'large'],
  default: 'middle',
  description: 'Size of the block.',
};

export const sizeSmallDefaultLarge = {
  type: 'string',
  enum: ['small', 'default', 'large'],
  default: 'default',
  description: 'Size of the block.',
};
