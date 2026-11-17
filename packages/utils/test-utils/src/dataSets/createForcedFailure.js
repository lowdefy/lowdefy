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

import { markForcedFailure, ServiceError } from '@lowdefy/errors';

// The error a fail gate throws: a ServiceError carrying the test's message, as a real outage
// would throw, so the routine's own error handling runs. It is branded forced (markForcedFailure)
// as the test's doing, so a host never reports it as an app error; an app's own error cannot
// carry the brand by accident.
function createForcedFailure({ message }) {
  return markForcedFailure(new ServiceError(message));
}

export default createForcedFailure;
