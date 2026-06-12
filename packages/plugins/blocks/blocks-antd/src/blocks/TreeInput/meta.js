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

import options from '../../schemas/options.js';
import treeSelectTheme from '../../schemas/treeSelectTheme.js';
import { data, html, valueKey, primaryKey, parentKey } from '../../schemas/dataOptions.js';
import { disabled } from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [],
  valueType: 'any',
  cssKeys: {
    element: 'The TreeInput element.',
  },
  events: {
    onChange: {
      description: 'Trigger action when selection is changed.',
      event: { value: 'The selected value.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      data,
      html,
      valueKey,
      primaryKey,
      parentKey,
      options,
      disabled,
      checkable: {
        type: 'boolean',
        default: false,
        description: 'Show checkboxes on the tree nodes.',
      },
      showLine: {
        type: 'boolean',
        default: false,
        description: 'Show a connecting line if true.',
      },
      selectable: {
        type: 'boolean',
        default: true,
        description: 'Selectable if true.',
      },
      defaultExpandAll: {
        type: 'boolean',
        default: false,
        description: 'Expand all tree nodes by default.',
      },
      theme: treeSelectTheme,
    },
  },
};
