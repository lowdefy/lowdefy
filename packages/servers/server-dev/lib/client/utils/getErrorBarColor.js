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

import entrySeverity, { ERROR, PROD_ERROR } from './entrySeverity.js';
import selectBarEntry from './selectBarEntry.js';

// Three severities: a real error is red, a warning that fails the production
// build is dark orange, and a plain warning is yellow. The colour is read off
// the entry selectBarEntry picked, which is the entry the bar renders.
function getErrorBarColor(errors) {
  const severity = entrySeverity(selectBarEntry(errors));
  if (severity === ERROR) return '#cf1322';
  if (severity === PROD_ERROR) return '#ad4e00';
  return '#d48806';
}

export default getErrorBarColor;
