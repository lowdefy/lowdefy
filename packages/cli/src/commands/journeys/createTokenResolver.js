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

import tokenText from './tokenText.js';

// Turns a clicked-text token back into text only when it is the token of a
// string in the app's config text set: a map from each config string's token
// to the string. Any other token resolves to null, so no reader ever learns a
// production text that is not already in the repository.
function createTokenResolver({ salt, texts }) {
  const byToken = new Map();
  texts.forEach((text) => {
    byToken.set(tokenText({ salt, text }), text);
  });
  return function resolve(token) {
    return byToken.get(token) ?? null;
  };
}

export default createTokenResolver;
