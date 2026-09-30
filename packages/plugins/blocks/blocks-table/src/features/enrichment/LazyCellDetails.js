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

import lazyComponent from '../../core/lazyComponent.js';

// The cell details panel (with the raw result's JSON tree), loaded when it first opens (a
// details cell preloads it on hover and focus).
const LazyCellDetails = lazyComponent(() => import('./CellDetails.js'));

export default LazyCellDetails;
