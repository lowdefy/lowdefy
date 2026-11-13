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

import { MongoError, MongoNetworkError, MongoServerSelectionError } from 'mongodb';

// The codes the driver resumes on for servers before 4.4 (GET_MORE_RESUMABLE_CODES, not exported).
// A 4.4+ server can send them without the ResumableChangeStreamError label, as it does 11602 in an
// election and 11600 when a primary shuts down in a rolling restart.
// Replica set state changes: InterruptedDueToReplStateChange (11602), NotWritablePrimary (10107),
// NotPrimaryNoSecondaryOk (13435), NotPrimaryOrSecondary (13436), PrimarySteppedDown (189),
// ShutdownInProgress (91), InterruptedAtShutdown (11600).
// Network and routing: HostUnreachable (6), HostNotFound (7), NetworkTimeout (89),
// SocketException (9001), ExceededTimeLimit (262), FailedToSatisfyReadPreference (133).
// Sharding and cursors: StaleShardVersion (63), StaleEpoch (150), StaleConfig (13388),
// RetryChangeStream (234), CursorNotFound (43).
const RESUMABLE_CODES = new Set([
  11602, 10107, 13435, 13436, 189, 91, 11600, 6, 7, 89, 9001, 262, 133, 63, 150, 13388, 234, 43,
]);

// The resume token is gone from the oplog (ChangeStreamHistoryLost, 286), or the server says
// the stream can not go on (ChangeStreamFatalError, 280). The source throws, and its channel
// restarts it from now and tells subscribers to fetch what they missed.
const FATAL_CODES = new Set([280, 286]);

// The driver resumes a change stream itself only for errors labelled ResumableChangeStreamError
// (on MongoDB 4.4+). A replica set election raises 11602 without that label, so the stream ends
// unless the resolver reopens it.
function isResumableChangeStreamError(error) {
  if (!(error instanceof MongoError)) return false;
  if (FATAL_CODES.has(error.code)) return false;
  if (error instanceof MongoNetworkError || error instanceof MongoServerSelectionError) {
    return true;
  }
  if (error.hasErrorLabel('ResumableChangeStreamError')) return true;
  return RESUMABLE_CODES.has(error.code);
}

export default isResumableChangeStreamError;
