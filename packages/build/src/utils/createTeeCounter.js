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

// Feeds each increment to the app counter that every build step reads, and to
// a second counter that records what one page uses.
function createTeeCounter({ counter, pageCounter }) {
  return {
    ...counter,
    increment: (key, configKey) => {
      counter.increment(key, configKey);
      pageCounter.increment(key, configKey);
    },
  };
}

export default createTeeCounter;
