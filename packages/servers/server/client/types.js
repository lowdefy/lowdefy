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

// The client resolves blocks, actions, operators and icons from these objects
// when it renders and runs events (initLowdefyContext keeps the references), so
// loadPageTypes merges each page's types into them in place and one set of
// registries serves every page the tab visits.
const types = {
  actions: {},
  blocks: {},
  icons: {},
  operators: {},
};

export default types;
