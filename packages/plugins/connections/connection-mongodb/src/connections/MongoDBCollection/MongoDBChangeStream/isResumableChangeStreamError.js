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

// Replica set state changes: the stream's server stopped being primary, or is shutting down.
// InterruptedDueToReplStateChange (11602), NotWritablePrimary (10107),
// NotPrimaryNoSecondaryOk (13435), PrimarySteppedDown (189), ShutdownInProgress (91).
const RESUMABLE_CODES = new Set([11602, 10107, 13435, 189, 91]);

// The resume token is gone from the oplog (ChangeStreamHistoryLost, 286), or the server says
// the stream can not go on (ChangeStreamFatalError, 280). Subscribers must reconnect and reload.
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
