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

import { BuildError, LowdefyInternalError, resolveErrorLocation } from '@lowdefy/errors';

function logCollectedErrors(context) {
  if (context.errors.length === 0) return;

  let loggedCount = 0;
  const seenSourceMessages = new Set();

  for (const err of context.errors) {
    const lowdefyErr = err.isLowdefyError
      ? err
      : new LowdefyInternalError(err.message, { cause: err });

    // handleError resolves the location and logs in one step, so the location
    // has to be resolved here to decide whether the entry is worth logging at
    // all. Resolution is pure, so handleError repeating it yields the same
    // location. Resolution reads author-supplied data (keyMap entries, refMap
    // paths), so a malformed entry can throw; the whole error report is worth
    // more than one error's source line, so a failure leaves the error
    // unlocated here and handleError logs it with its own guarded resolution.
    let location = null;
    try {
      location = resolveErrorLocation(lowdefyErr, {
        keyMap: context.keyMap,
        refMap: context.refMap,
        configDirectory: context.directories?.config,
      });
    } catch {
      location = null;
    }

    // Two build steps can report the same config line: buildAuth reaches page,
    // endpoint and agent ids before validateId does, and both gates give the
    // same message. Two genuinely distinct errors never share both a resolved
    // source line and a message, so that pair is safe to collapse. Without a
    // resolved source line there is no such evidence - the message alone would
    // collapse distinct internal errors and under-count the failures - so
    // unlocated errors are always reported.
    if (location?.source) {
      const dedupKey = `${location.source}\n${lowdefyErr.message}`;
      if (seenSourceMessages.has(dedupKey)) continue;
      seenSourceMessages.add(dedupKey);
    }

    context.handleError(lowdefyErr);
    loggedCount += 1;
  }

  throw new BuildError(`Build failed with ${loggedCount} error(s). See above for details.`);
}

export default logCollectedErrors;
