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

import getLabelState from './getLabelState.js';

/**
 * An input's label properties, as the web inputs pass them to Label: the input's `title` and
 * `size` with its `label` object over them, and the accessibility label of its control: the label
 * title, or else the placeholder, which is what a person sees in an input without a label.
 *
 * @param {Object} params
 * @param {Object} params.properties The input's properties.
 * @returns {{ labelProperties: Object, accessibilityLabel: string|undefined }}
 */
function getLabelProperties({ properties }) {
  const labelProperties = { title: properties.title, size: properties.size, ...properties.label };
  const { title } = getLabelState({ properties: labelProperties });
  return { labelProperties, accessibilityLabel: title ?? properties.placeholder };
}

export default getLabelProperties;
