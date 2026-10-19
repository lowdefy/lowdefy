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

import TableRoot from '../../core/TableRoot.js';
import useFeatureSet from '../../core/useFeatureSet.js';

// The Table implementation: the core with the feature modules this table's config uses. A config
// change that needs another set of features remounts the core with it.
function Table(props) {
  const features = useFeatureSet({
    content: props.content,
    properties: props.properties,
    rowWindowStrategy: props.rowWindowStrategy,
  });
  return React.createElement(TableRoot, { ...props, features, key: features.signature });
}

export default withBlockDefaults(Table);
