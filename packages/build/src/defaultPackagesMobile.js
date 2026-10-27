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

// The packages a native shell carries for each per-target type class. Mobile
// pages resolve blocks and actions against these alone: a web block package
// renders with React DOM, and the shell registers native bodies for the
// actions-core actions under the same names, and blocks-native's native-only
// actions (Haptic, Share, PickFile, ...). Client operators are plain
// JavaScript, so the operators of every default package (defaultPackages)
// resolve on mobile too. Server-side types are not per-target: requests,
// connections and server operators resolve against the web types map.
const defaultPackagesMobile = {
  actions: ['@lowdefy/actions-core', '@lowdefy/blocks-native'],
  blocks: ['@lowdefy/blocks-native'],
};

export default defaultPackagesMobile;
