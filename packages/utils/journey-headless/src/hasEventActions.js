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

// Whether the block's event runs anything when its component fires it: it has actions, or it
// bubbles to the block around it. An app can declare an event with no actions (a shared component
// whose `on_open_change` defaults to []), which a browser fires to no effect.
function hasEventActions({ block, name }) {
  const event = block.Events.events[name];
  if (event === undefined) {
    return false;
  }
  return event.actions.length > 0 || event.bubble === true;
}

export default hasEventActions;
