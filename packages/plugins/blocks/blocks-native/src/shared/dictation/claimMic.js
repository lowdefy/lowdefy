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

// The phone has one recogniser for the whole app, and its events reach every listener. The
// input holding the mic is the one whose session the events belong to.
const HANDOVER_MS = 1500;

let current = null;
let pending = null;

function waitForRelease(claim) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, HANDOVER_MS);
    claim.released.then(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/**
 * Takes the phone's one recogniser for an input. When another input holds it, that input's `end`
 * is called so it stops and keeps its words; the claim resolves once it has released the mic (its
 * session's last events have arrived), or after 1.5 s. A later claim made while this one waits
 * wins, and this one then resolves to null.
 *
 * @param {Object} params
 * @param {() => void} params.end Called when another input takes the mic from this one.
 * @returns {Promise<{ owns: () => boolean, release: () => void }|null>} `owns` tells whether the
 *   recogniser's events are this input's; `release` gives the mic back once the session has ended.
 */
async function claimMic({ end }) {
  const claim = { end };
  claim.released = new Promise((resolve) => {
    claim.resolveReleased = resolve;
  });
  const handle = {
    owns: () => current === claim,
    release: () => {
      if (current === claim) {
        current = null;
      }
      claim.resolveReleased();
    },
  };
  const previous = current;
  pending = claim;
  if (previous !== null) {
    previous.end();
    await waitForRelease(previous);
  }
  if (pending !== claim) {
    return null;
  }
  pending = null;
  current = claim;
  return handle;
}

export default claimMic;
