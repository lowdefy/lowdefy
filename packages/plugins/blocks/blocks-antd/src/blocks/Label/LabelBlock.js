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

import Label from './Label.js';

// The Label block styles its own row with the `element` cssKey. Input blocks render Label with
// their input's classNames and styles, where `element` means the input, so only the block maps
// `element` onto the row.
function LabelBlock(props) {
  const { classNames = {}, styles = {} } = props;
  return <Label {...props} rowClassName={classNames.element} rowStyle={styles.element} />;
}

export default LabelBlock;
