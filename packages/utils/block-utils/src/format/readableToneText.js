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

// A text colour for a tone that reads on the tone's tinted fill: the colour mixed toward the
// theme's text colour (black in light themes, white in dark ones), so it darkens on light fills
// and lightens on dark ones. `share` is the tone's part of the mix, in percent.
function readableToneText({ color, share }) {
  return `color-mix(in oklab, ${color} ${share}%, var(--ant-color-text-base, #000))`;
}

export default readableToneText;
