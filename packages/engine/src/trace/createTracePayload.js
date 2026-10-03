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

import summariseFailure from './summariseFailure.js';

function createTracePayload({ actions, block, context, debounceMs, record, stateBefore }) {
  const { lowdefy } = context._internal;
  const isApp = context === lowdefy.appContext;
  return {
    scope: isApp ? 'app' : 'page',
    // App events run on whichever page the app loaded on.
    pageId: isApp ? lowdefy.pageId : context.pageId,
    blockId: record.blockId,
    // The app context's Box root is an implementation detail.
    blockType: isApp ? null : block.type,
    eventName: record.eventName,
    success: record.success,
    failure: record.success ? null : summariseFailure(record.error),
    debounceMs,
    actions,
    record,
    context,
    stateBefore,
  };
}

export default createTracePayload;
