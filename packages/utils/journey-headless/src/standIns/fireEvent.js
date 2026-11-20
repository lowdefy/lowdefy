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

// Fires one of a block's events as its component does, without waiting for it: the actor holds it
// until the step settles. Resolves the event's response ({ success, bounced, ... }), which the
// engine returns at once, not as a promise, for an event the block does not define or one that
// bounced.
function fireEvent({ actor, block, name, event }) {
  return actor.track(Promise.resolve(block.triggerEvent({ name, event })));
}

// Resolves once a fired event has finished, however it ended: what antd fires after an animation
// (afterOpenChange, afterClose) waits on the event that started it.
function afterEvent(promise) {
  return promise.then(
    () => undefined,
    () => undefined
  );
}

export { afterEvent };
export default fireEvent;
