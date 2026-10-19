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

import { mapPlainValues, type } from '@lowdefy/helpers';

import scrubSecrets from '../scrubSecrets.js';

function returnUnchanged(value) {
  return value;
}

// Class instances are left as they are: Sentry normalizes those before beforeSend
// runs, so the event hook still reaches their strings. Breadcrumbs reach
// beforeBreadcrumb un-normalized - a console breadcrumb holds the logged arguments
// as they are - so the walk must be cycle-safe, which mapPlainValues is.
// An event also carries its request's credential scrub (the Sentry middleware puts it on the
// request's isolation scope), which reaches the credentials that request marked when the event
// is sent after the request's scope has ended, as a transaction is.
function scrubEvent(value) {
  const scrubRequestCredentials =
    value?.sdkProcessingMetadata?.scrubRequestCredentials ?? returnUnchanged;
  return mapPlainValues(value, (item) =>
    type.isString(item) ? scrubRequestCredentials(scrubSecrets(item)) : item
  );
}

export default scrubEvent;
