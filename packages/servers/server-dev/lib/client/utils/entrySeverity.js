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

// The three severities the ErrorBar distinguishes, ordered: a real error, a
// warning that fails the production build, and a plain warning. An info-level
// entry (a dev notice such as an unscoped tenant: none read) is not an error,
// so an app with only notices sits at the lowest severity.
const ERROR = 2;
const PROD_ERROR = 1;
const WARNING = 0;

function entrySeverity(entry) {
  if (entry.level !== 'info' && entry.type !== 'ConfigWarning') {
    return ERROR;
  }
  if (entry.prodError === true) {
    return PROD_ERROR;
  }
  return WARNING;
}

export { ERROR, PROD_ERROR, WARNING };
export default entrySeverity;
