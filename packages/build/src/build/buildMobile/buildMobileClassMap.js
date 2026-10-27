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

import { type } from '@lowdefy/helpers';

import compileMobileClassMap from './compileMobileClassMap.js';

// The per-app Tailwind class map a shell styles native blocks with, compiled
// from the class candidates of mobile and shared pages
// (collectMobileClassCandidates) with the app's theme.
async function buildMobileClassMap({ components, context }) {
  context.mobileClassMap = {};
  if (type.isNone(components.mobile)) {
    return components;
  }
  context.mobileClassMap = await compileMobileClassMap({
    candidates: context.mobileClassCandidates ?? [],
    context,
    mobileTheme: context.mobileTheme,
    tailwindConfig: components.theme?.tailwind,
  });
  return components;
}

export default buildMobileClassMap;
