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

// Per-breakpoint label widths, read by Label's getLabelCol and getWrapperCol when the label is not
// inline. Each takes a `span` out of 24 columns; the content takes the rest of the row.
const span = {
  type: 'number',
  minimum: 0,
  maximum: 24,
  description: 'Label width in columns, out of 24. The content takes the remaining columns.',
};

export default {
  xs: {
    type: 'object',
    description: 'Label width on extra small screens (below 576px) when the label is not inline.',
    properties: { span },
  },
  sm: {
    type: 'object',
    description:
      'Label width on small screens (576px and up) when the label is not inline. Also applies below 576px unless `xs` is set.',
    properties: { span },
  },
  md: {
    type: 'object',
    description:
      'Label width on medium screens (768px and up) when the label is not inline. Overrides `span`.',
    properties: { span },
  },
  lg: {
    type: 'object',
    description: 'Label width on large screens (992px and up) when the label is not inline.',
    properties: { span },
  },
  xl: {
    type: 'object',
    description: 'Label width on extra large screens (1200px and up) when the label is not inline.',
    properties: { span },
  },
  xxl: {
    type: 'object',
    description:
      'Label width on extra extra large screens (1600px and up) when the label is not inline.',
    properties: { span },
  },
};
