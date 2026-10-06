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

// The verdict of one (mutant, journey) run. A failed step is the journey
// noticing the mutant only when the mutant reached the run; anything else (a
// failure the mutant never touched, the runner could not run, the server did
// not answer) says nothing about it and is an error, which is retried once.
function toVerdict(result) {
  const applied = result.mutant?.applied ?? 0;
  const misses = result.mutant?.misses ?? [];
  if (result.passed) {
    if (applied >= 1) {
      return { verdict: 'survived' };
    }
    return { verdict: 'unapplied', misses };
  }
  if (type.isNone(result.failure)) {
    return { verdict: 'error', message: result.message };
  }
  if (applied === 0) {
    return {
      verdict: 'error',
      message: `The journey failed at step ${result.failure.index} (${result.failure.message}), but the mutant was never applied, so the failure says nothing about it.`,
      misses,
    };
  }
  return {
    verdict: 'killed',
    failure: { index: result.failure.index, message: result.failure.message },
  };
}

export default toVerdict;
