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

// Errors that are expected outcomes, never faults: a UserError (the app or its
// user saying no on purpose) and the auth gates' refusals. A server error
// handler that catches one answers it itself - a 400, 401 or 403 with
// { name, message } and one warning line. They still stop the action, show
// their message and run its catch actions, but they are never posted to
// /api/client-error and never an app error to a journey or an explorer walk.
// Keyed on the class name, because plugins bundle their own @lowdefy/errors
// copy and a server answer reaches the client as a name only.
const expectedErrorNames = new Set([
  'AuthenticationError',
  'AuthorizationError',
  'TwoFactorEnrolmentRequiredError',
  'UserError',
]);

export default expectedErrorNames;
