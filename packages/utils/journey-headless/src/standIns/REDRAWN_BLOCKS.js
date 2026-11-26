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

// The blocks a CallMethod has called a method on that their meta declares null in
// headlessMethods (registerHeadlessMethods), by block, with the method's name: such a method
// changes only what the block draws, which a headless run does not follow, so a text check on the
// block leaves its text open (readTextModel). A block belongs to one page, so this holds it only
// while the page does.
const REDRAWN_BLOCKS = new WeakMap();

export default REDRAWN_BLOCKS;
