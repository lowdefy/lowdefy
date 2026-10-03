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

// Key and ref map entries the dev server's kept JIT build context may add
// before it is recreated. Every page build adds entries to both maps and they
// are released only with the context, so this bounds one dev server's memory.
// Measured on the docs app: about 530 entries and 400-750 KB of retained heap
// per page build, so this is about 90 page builds and 35-65 MB.
const contextMapBudget = 48000;

export default contextMapBudget;
