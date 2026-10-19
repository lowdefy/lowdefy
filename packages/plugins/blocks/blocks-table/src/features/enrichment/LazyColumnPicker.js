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

// The add / edit column picker, loaded when it first opens (the "+" header preloads it on hover
// and focus, a user column's header menu when it opens).
const LazyColumnPicker = lazyComponent(() => import('./ColumnPicker.js'));

export default LazyColumnPicker;
