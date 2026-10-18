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

// The breakpoints of v7's grid.css and the _media operator (Tailwind CSS's), smallest first, with
// the width each starts at. A layout value set for a breakpoint applies from that breakpoint up.
const breakpoints = [
  { name: 'xs', minWidth: 0 },
  { name: 'sm', minWidth: 640 },
  { name: 'md', minWidth: 768 },
  { name: 'lg', minWidth: 1024 },
  { name: 'xl', minWidth: 1280 },
  { name: '2xl', minWidth: 1536 },
];

export default breakpoints;
