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

// Below this many production rows in the window, sessions are few enough for
// a reader to go through one by one with `lowdefy journeys session --source
// production`, and grouping them into flows hides the detail a reader reasons
// from. From this many on, coverage and usage group sessions into flows.
const FLOW_GROUPING_MIN_ROWS = 100000;

export default FLOW_GROUPING_MIN_ROWS;
