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

// The only enrichment cell properties the requests write, under `_enrich.<column key>`. Every
// update the three requests send is built from these (buildCellUpdate), so nothing else of
// a row can be written by an enrichment run.
const cellProperties = [
  'status',
  'value',
  'raw',
  'error',
  'inputHash',
  'runId',
  'claimToken',
  'attempts',
  'queuedAt',
  'startedAt',
  'finishedAt',
  'leaseUntil',
];

export default cellProperties;
