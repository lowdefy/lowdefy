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

// Where a mutant sits, in the terms a journey's measured path uses, so the
// harden run can tell which journeys reach it.
function buildAnchor({ scope, type }) {
  switch (type) {
    case 'action':
      return {
        type,
        pageId: scope.pageId,
        blockId: scope.blockId,
        eventName: scope.eventName,
        actionId: scope.actionId,
      };
    case 'block':
      return {
        type,
        pageId: scope.pageId,
        blockId: scope.blockId,
        parentBlockId: scope.parentBlockId,
      };
    case 'request':
      return { type, pageId: scope.pageId, requestId: scope.requestId };
    case 'endpoint':
      return { type, endpointId: scope.endpointId };
    default:
      throw new Error(`Unknown mutant anchor type "${type}".`);
  }
}

export default buildAnchor;
