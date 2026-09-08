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
import { withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import TagPillRow from '../../TagPillRow.js';
import getTagSelectorOptions from '../../getTagSelectorOptions.js';

// Single-select tag input: `value` is one option value (or null). Clicking a
// pill selects it; clicking the already-selected pill clears the value. Purely
// controlled — the value is read from props each render. See TagPillRow for the
// shared rendering/color logic and TagMultipleSelector for the multi-select
// variant whose value is the array of selected values.
const TagSelector = (props) => {
  const { loading, methods, properties, value } = props;
  const options = getTagSelectorOptions({ options: properties.options });
  const isSelected = (optionValue) => !type.isNone(value) && value === optionValue;
  const onToggle = (option) => {
    if (option.disabled || properties.disabled || loading) return;
    const next = value === option.value ? null : option.value;
    methods.setValue(next);
    methods.triggerEvent({ name: 'onChange', event: { value: next } });
  };
  return <TagPillRow {...props} options={options} isSelected={isSelected} onToggle={onToggle} />;
};

export default withBlockDefaults(TagSelector);
