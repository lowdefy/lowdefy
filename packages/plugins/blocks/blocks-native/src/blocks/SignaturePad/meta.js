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
import { disabled, inputTitle, theme } from '../../schemas/inputProperties.js';

// SignaturePad has no web block of its name: a page that uses it is mobile only. It is drawn with
// react-native-svg and React Native's responder, so every shell carries it.
export default {
  category: 'input',
  icons: [],
  valueType: 'object',
  cssKeys: {
    element: 'The signing area.',
    label: 'The SignaturePad label.',
    extra: 'The SignaturePad extra content.',
    feedback: 'The SignaturePad validation feedback.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when a stroke ends.',
      event: { value: 'The signature: { svg, strokes, width, height }.' },
    },
    onClear: { description: 'Trigger actions when the signature is cleared.' },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      clearText: {
        type: 'string',
        default: 'Clear',
        description: 'The text of the clear button.',
      },
      color: { type: 'string', description: 'The ink colour. The label colour by default.' },
      disabled,
      height: { type: 'number', default: 200, description: 'The height of the signing area.' },
      label,
      placeholder: {
        type: 'string',
        default: 'Sign here',
        description: 'Text shown in the empty signing area.',
      },
      strokeWidth: { type: 'number', default: 2.5, description: 'The ink width in points.' },
      theme,
      title: inputTitle,
    },
  },
};
