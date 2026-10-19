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

// How long a cell queued waiting for an input column (`waitingFor`) stays out of claims. The
// input's completion releases it at once (MongoDBEnrichmentComplete); this only bounds the wait
// when that never comes (the input's worker lost its lease on the last attempt), after which a
// claim looks at the cell again.
const waitingParkMs = 600000;

export default waitingParkMs;
