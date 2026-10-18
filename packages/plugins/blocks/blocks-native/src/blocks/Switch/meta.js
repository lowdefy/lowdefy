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

import label from '../../schemas/inputLabel.js';
import { autoFocus, disabled, inputTitle, theme, webIcon } from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [],
  valueType: 'boolean',
  cssKeys: {
    element: 'The Switch.',
    label: 'The Switch label.',
    extra: 'The Switch extra content.',
    feedback: 'The Switch validation feedback.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when the switch is toggled.',
      event: { value: 'Whether the switch is on.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      autoFocus,
      checkedIcon: webIcon,
      checkedText: {
        type: 'string',
        description: 'Text shown beside the switch while it is on.',
      },
      color: {
        type: 'string',
        description: 'The colour of the switch while it is on.',
      },
      disabled,
      label,
      loading: {
        type: 'boolean',
        default: false,
        description: 'Disable the switch while something loads.',
      },
      size: {
        type: 'string',
        enum: ['small', 'default'],
        default: 'default',
        description: 'Ignored on mobile: the switch takes the platform size.',
      },
      theme,
      title: inputTitle,
      uncheckedIcon: webIcon,
      uncheckedText: {
        type: 'string',
        description: 'Text shown beside the switch while it is off.',
      },
    },
  },
};
