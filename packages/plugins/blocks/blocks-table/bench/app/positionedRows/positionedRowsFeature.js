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

import usePositionedRows from './usePositionedRows.js';

// The benchmark's comparison row window (strategy `positioned`), with TanStack Virtual. BenchTable
// passes it to the Table as `rowWindowFeature`; it lives here so TanStack Virtual stays a
// devDependency of the published block.
const positionedRowsFeature = {
  name: 'positionedRows',
  useGridFeature: usePositionedRows,
};

export default positionedRowsFeature;
