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

import { type } from '@lowdefy/helpers';

import authorizeViewWrite from './authorizeViewWrite.js';

// What a request may do is told from its resolver's meta, and only one shape
// of it says "this reads and does not write": checkRead true and checkWrite
// not true. checkWrite false alone says nothing of the kind - request types
// that call an HTTP API, run SQL, send mail or take a payment declare neither
// check, because their connection has no read or write switch to check
// against, and they write all the same.
//
// So a view session on a read-only grant runs a request only when its resolver
// declares the read. Every other request is refused as a write, with
// view_write_required. This holds for a page's own request and for a request
// step in an endpoint's routine alike: an endpoint's mcp:read scope is the
// app's declaration, and the steps are what the routine does.
//
// With mcp:write the person's roles alone decide, and a caller that is not a
// view session is never refused here.
function authorizeViewRequestResolver(context, { requestId, requestResolver }) {
  if (type.isNone(context.viewSession)) {
    return;
  }
  const { checkRead, checkWrite } = requestResolver.meta ?? {};
  if (checkRead === true && checkWrite !== true) {
    return;
  }
  authorizeViewWrite(context, { subject: `request "${requestId}"` });
}

export default authorizeViewRequestResolver;
