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

// The id log of each map a JIT build context holds, keyed by the map. A page
// build adds key and ref entries to the maps it shares with the other page
// builds on its context, and the inserts log their ids here (logMapId), so a
// page build finds the entries it added without walking the whole map. A map
// with no log (a config build's, or a copy a check works on) logs nothing.
const mapIdLogs = new WeakMap();

export default mapIdLogs;
