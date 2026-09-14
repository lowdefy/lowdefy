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

// The client-bound error policy: which fields of an error may cross the wire.
// Passed to serializer.serialize as `omitErrorProps`, so extractErrorProps applies
// it at EVERY error node the walk emits - the cause chain, an Error-valued own
// property, and an Error nested inside a plain object or array. The policy is
// stated against the emitter rather than against a response shape, so it cannot
// become depth-limited.
//
// `received` is not merely "may be sensitive": on the request path
// callRequestResolver sets it to the EVALUATED request properties, so a _secret
// resolved into a request header is in it. `stack` exposes server internals,
// including absolute node_modules paths. Both are unbounded runtime data nobody
// chose, in every environment - the full value stays in the server log, which is
// where a developer on their own machine reads it.
const ALWAYS_OMITTED = ['received', 'stack'];
const OMITTED_WITH_CAUSE = [...ALWAYS_OMITTED, 'cause'];

function omitErrorProps(error) {
  // An Error cause is the trace the browser renders (name + message per level),
  // so it is always kept - fields are taken from causes, causes are never pruned.
  // A non-Error cause is internal server config: the whole endpoint routine, a
  // control node, ajv errors. UserError is the exception, the one class whose
  // payload the author wrote for the client.
  //
  // type.isError is `instanceof Error`, the same test extractErrorProps uses to
  // decide which branch emits the cause - the two must agree.
  // A ServiceError's cause is the driver's or the service's own error, whose raw
  // message the plugin deliberately did not put in the ServiceError message - it
  // can carry server internals and caller data (a duplicate key error quotes the
  // document's values). The cause stays on the error in-process, so
  // createHandleError logs it and createCliLogger prints
  // `Caused by: MongoServerError: <raw text>` in the server terminal.
  if (error.name === 'ServiceError') return OMITTED_WITH_CAUSE;
  if (type.isError(error.cause)) return ALWAYS_OMITTED;
  // Keyed on the name, not instanceof - the error may cross a package boundary
  // or a serializer round trip and still be a UserError.
  if (error.name === 'UserError') return ALWAYS_OMITTED;
  return OMITTED_WITH_CAUSE;
}

export default omitErrorProps;
