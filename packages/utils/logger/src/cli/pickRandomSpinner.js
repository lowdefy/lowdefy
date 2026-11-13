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

import { spinners } from 'ora';

// ora 7 took the name 'random' through cli-spinners 2, which cli-spinners 3 (ora 9 and later)
// dropped, so the spinner is picked here.
function pickRandomSpinner() {
  const names = Object.keys(spinners);
  return spinners[names[Math.floor(Math.random() * names.length)]];
}

export default pickRandomSpinner;
