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

import { FONT_FAMILY } from '../../fonts/fonts.js';

// `fonts` key → the CSS weight and style the face answers to, so
// `font-weight: 700` and `font-style: italic` in the markup resolve.
const FONT_FACES = [
  ['regular', 400, 'normal'],
  ['bold', 700, 'normal'],
  ['italic', 400, 'italic'],
  ['boldItalic', 700, 'italic'],
];

let registered;

// Register the report fonts with the shared renderer, once per process. Without
// fonts takumi has no faces to shape text with, so this must resolve before the
// first render; with none supplied it stays unregistered and a later render
// that does carry fonts registers them.
async function registerFonts({ renderer, fonts }) {
  if (registered) return registered;
  if (!fonts) return undefined;
  registered = Promise.all(
    FONT_FACES.filter(([key]) => fonts[key]).map(([key, weight, style]) =>
      renderer.registerFont({ name: FONT_FAMILY, data: fonts[key], weight, style })
    )
  ).catch((error) => {
    // Forget the failure. A cached rejected promise would be handed to every
    // later block in every later report, so one transient failure here would
    // skip every Html block for the life of the process. Rethrow so this block
    // still reports it.
    registered = undefined;
    throw error;
  });
  return registered;
}

export default registerFonts;
