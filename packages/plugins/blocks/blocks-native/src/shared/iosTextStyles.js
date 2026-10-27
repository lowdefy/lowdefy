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

// The iOS text styles (Dynamic Type at the default size) that lists and rows set their text in.
// No font family: React Native draws the system font, SF Pro on iOS.
const iosTextStyles = {
  body: { fontSize: 17, fontWeight: '400', letterSpacing: -0.41, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400', letterSpacing: 0, lineHeight: 16 },
  footnote: { fontSize: 13, fontWeight: '400', letterSpacing: -0.08, lineHeight: 18 },
  headline: { fontSize: 17, fontWeight: '600', letterSpacing: -0.41, lineHeight: 22 },
  subheadline: { fontSize: 15, fontWeight: '400', letterSpacing: -0.24, lineHeight: 20 },
};

export default iosTextStyles;
