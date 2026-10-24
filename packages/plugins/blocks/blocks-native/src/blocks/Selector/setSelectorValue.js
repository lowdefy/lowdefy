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

import getOptionValue from './getOptionValue.js';
import playFeedback from '../../device/playFeedback.js';

/**
 * Sets the value a Selector's menu or sheet picked and fires its events: onChange with the new
 * value, and onClear too when the pick was the item that stands for no value. Picking the option
 * already chosen changes nothing.
 *
 * @param {Object} params
 * @param {number|null} params.index The picked option's index, or null for no value.
 * @param {Object} params.methods The block's methods.
 * @param {Array} params.options
 * @param {number|null} params.selectedIndex The index of the option chosen before the pick.
 */
function setSelectorValue({ index, methods, options, selectedIndex }) {
  if (index === selectedIndex) return;
  playFeedback();
  if (index === null) {
    methods.setValue(null);
    methods.triggerEvent({ name: 'onChange', event: { value: null } });
    methods.triggerEvent({ name: 'onClear' });
    return;
  }
  const next = getOptionValue({ option: options[index] });
  methods.setValue(next);
  methods.triggerEvent({ name: 'onChange', event: { value: next } });
}

export default setSelectorValue;
