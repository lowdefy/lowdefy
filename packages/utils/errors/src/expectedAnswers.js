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

// The HTTP answer a server gives each expected outcome: its status, the one warning line it
// logs and the text a page route answers with. isExpectedError decides which errors are
// expected; this table only gives the answer, and every server's error handler reads it, so a
// refusal gets the same status whichever server it reaches.
//   AuthenticationError: an unauthenticated request to a protected endpoint.
//   AuthorizationError: an authenticated caller whose roles do not permit the resource.
//   TwoFactorEnrolmentRequiredError: an authorized caller who has not enrolled a second factor
//     under auth.twoFactor.required. 403, not 401 - a 401 reads to the client as a dead session
//     and bounces the user to sign-in, which is the loop the gate exists to avoid.
//   UserError: an API client whose payload does not match the endpoint's payloadSchema (or any
//     other UserError raised before a routine starts). A page's CallAPI payload the schema
//     refuses is a ConfigError instead: the page's own config built it (validatePayload). A
//     UserError raised inside a routine never gets here - it returns 200 with success: false
//     through buildEndpointResult.
// A name expectedErrorNames gains before this table does is still a refusal: answer it as a
// UserError, a 400.
const expectedAnswers = {
  AuthenticationError: { status: 401, warning: 'Unauthenticated request', text: 'Unauthorized' },
  AuthorizationError: { status: 403, warning: 'Forbidden', text: 'Forbidden' },
  TwoFactorEnrolmentRequiredError: {
    status: 403,
    warning: 'Two-factor enrolment required',
    text: 'Two-factor enrolment required',
  },
  UserError: { status: 400, warning: 'Bad request', text: 'Bad Request' },
};

export default expectedAnswers;
