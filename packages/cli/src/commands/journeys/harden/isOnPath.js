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

// Whether a mutant sits on what one journey's baseline run exercised
// (the journey hardening design, "Which journeys run a mutant"):
// - an action on a page: an event for that (pageId, blockId, eventName) ran;
// - an action in the app events: always, every journey's first load runs them;
// - a block: it was rendered; for flip-visible its parent being rendered is
//   enough, since a block hidden by its own visible was evaluated but never
//   shown;
// - a request or an endpoint: it was called, nested endpoints included.
function isOnPath({ anchor, operator, exercised }) {
  switch (anchor.type) {
    case 'action':
      if (anchor.pageId === 'app') {
        return true;
      }
      return exercised.events.some(
        (event) =>
          event.pageId === anchor.pageId &&
          event.blockId === anchor.blockId &&
          event.eventName === anchor.eventName
      );
    case 'block': {
      const rendered = exercised.rendered[anchor.pageId] ?? [];
      if (rendered.includes(anchor.blockId)) {
        return true;
      }
      return operator === 'flip-visible' && rendered.includes(anchor.parentBlockId);
    }
    case 'request':
      return exercised.requests.some(
        (request) => request.pageId === anchor.pageId && request.requestId === anchor.requestId
      );
    case 'endpoint':
      return exercised.endpoints.some((endpoint) => endpoint.endpointId === anchor.endpointId);
    default:
      throw new Error(`Unknown mutant anchor type "${anchor.type}".`);
  }
}

export default isOnPath;
