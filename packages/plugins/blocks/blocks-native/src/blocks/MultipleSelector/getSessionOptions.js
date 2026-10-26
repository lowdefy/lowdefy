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
import getOptionIndex from '../Selector/getOptionIndex.js';

/**
 * The options a MultipleSelector picks from: its `options`, then the values it has added this
 * session (new values typed into the search, and chosen values no option holds) as primitive
 * options, so each stays in the sheet to be checked or unchecked.
 *
 * @param {Object} params
 * @param {Array} params.options The block's options.
 * @param {Array} params.sessionValues
 * @returns {Array}
 */
function getSessionOptions({ options, sessionValues }) {
  const added = sessionValues.filter(
    (value, position) =>
      getOptionIndex({ options, value }) === null &&
      getOptionIndex({ options: sessionValues.slice(0, position), value }) === null
  );
  return [...options, ...added];
}

export default getSessionOptions;
