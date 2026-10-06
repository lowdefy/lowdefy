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

import toAppErrorFailure from './toAppErrorFailure.js';

// The step's failure once the app errors its window held are counted. App
// errors fail the step, leading any failure of the step's own. A step that
// left the journey's origin keeps that failure, since what it saw afterwards
// is not what the app does, and carries the app errors beside it.
function withAppErrors({ failure, leftOrigin, findings, index, step }) {
  const appFailure = toAppErrorFailure({ findings, index, step, stepFailure: failure });
  if (leftOrigin) {
    return { ...failure, errors: appFailure.errors };
  }
  return appFailure;
}

export default withAppErrors;
