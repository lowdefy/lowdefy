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
import { type } from '@lowdefy/helpers';

import './selectOption.css';

// An option in a select's dropdown (antd Select `optionRender`, the cell editor): the option as
// the cell shows it, with the option's `description` on a muted line under it. Only the dropdown
// draws the description: the picked value in the select box and the closed cell show the label
// alone. An option without a description is the label, as antd renders it by default.
function SelectOption({ data, label }) {
  if (type.isNone(data.description)) return label;
  return (
    <span className="lf-table-option">
      {label}
      <span className="lf-table-option-description">{data.description}</span>
    </span>
  );
}

export default SelectOption;
