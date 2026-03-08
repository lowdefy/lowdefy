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

// Framework-level defaults for block component props.
// Spread before explicit props at every render site so blocks always
// receive safe values — replaces React.defaultProps which was removed in React 19.
const blockDefaults = {
  classNames: {},
  content: {},
  events: {},
  list: [],
  loading: false,
  properties: {},
  required: false,
  styles: {},
  validation: { status: null, errors: [], warnings: [] },
};

export default blockDefaults;
