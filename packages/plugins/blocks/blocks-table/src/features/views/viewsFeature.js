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

import mountViewValue from './mountViewValue.js';
import notifyViewSelect from './notifyViewSelect.js';
import useViews from './useViews.js';

// Saved views and view persistence. `mountValue` supplies the view a table mounts with when it
// has no value: the persisted view, else the active saved view.
const viewsFeature = {
  name: 'views',
  mountValue: mountViewValue,
  onCommit: notifyViewSelect,
  useFeature: useViews,
};

export default viewsFeature;
