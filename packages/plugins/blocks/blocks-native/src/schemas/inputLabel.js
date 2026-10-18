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

// The `label` property of the native inputs. It keeps the web inputs' label object, so a shared
// page's labels pass both schemas. Keys a phone does not honour are accepted and ignored, as
// their descriptions say.
const columnSpan = {
  type: 'object',
  description: 'Ignored on mobile: the label is always above or beside its input.',
  properties: { span: { type: 'number' } },
};

export default {
  type: 'object',
  description: 'Label properties.',
  additionalProperties: false,
  properties: {
    align: {
      type: 'string',
      enum: ['left', 'right'],
      default: 'left',
      description: 'Ignored on mobile.',
    },
    colon: {
      type: 'boolean',
      default: true,
      description: 'Append a colon to the label when it is inline.',
    },
    disabled: {
      type: 'boolean',
      default: false,
      description: 'Hide the input label.',
    },
    extra: {
      type: 'string',
      description: 'Extra text to display beneath the input. Shown as plain text on mobile.',
    },
    hasFeedback: {
      type: 'boolean',
      default: true,
      description: 'Display validation messages beneath the input. This does not disable validation.',
    },
    inline: {
      type: 'boolean',
      default: false,
      description: 'Render the label beside the input.',
    },
    span: {
      type: 'number',
      description: 'Ignored on mobile: the label is always above or beside its input.',
    },
    title: {
      type: 'string',
      description: 'Label title. Shown as plain text on mobile.',
    },
    tooltip: {
      type: ['string', 'object'],
      description: 'Ignored on mobile: a phone has no hover.',
    },
    wrap: {
      type: 'boolean',
      default: false,
      description: 'Ignored on mobile: labels always wrap.',
    },
    xs: columnSpan,
    sm: columnSpan,
    md: columnSpan,
    lg: columnSpan,
    xl: columnSpan,
  },
};
