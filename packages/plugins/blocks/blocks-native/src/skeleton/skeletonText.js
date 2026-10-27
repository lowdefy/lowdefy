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

// The iOS text styles a skeleton bar stands in for: the line height the text takes, so the
// content that replaces the skeleton takes the same room, and the bar's height inside it, a little
// under the line, so stacked lines read as separate bars. Bars have round caps (SkeletonLine).
const skeletonText = {
  title1: { height: 26, lineHeight: 34 },
  title2: { height: 20, lineHeight: 28 },
  headline: { height: 17, lineHeight: 22 },
  body: { height: 15, lineHeight: 22 },
  subheadline: { height: 14, lineHeight: 20 },
  footnote: { height: 12, lineHeight: 18 },
};

export default skeletonText;
