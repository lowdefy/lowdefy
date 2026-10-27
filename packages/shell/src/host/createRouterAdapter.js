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

import { router } from 'expo-router';

import toRouterHref from '../navigation/toRouterHref.js';

// The core's router contract (push, replace, back) on Expo Router.
function createRouterAdapter({ session }) {
  function href(target) {
    return toRouterHref({ ...target, root: session.getState().root });
  }
  return {
    push: (target) => router.push(href(target)),
    replace: (target) => router.replace(href(target)),
    back: () => router.back(),
  };
}

export default createRouterAdapter;
