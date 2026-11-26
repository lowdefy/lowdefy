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
// before it is released and the next page build makes a new one. Every page
// build adds entries to both maps and they are freed only with the context, so
// this bounds one dev server's memory. Retained heap measured about 290 bytes
// an entry, so this is about 140 MB. A new context costs 4-16 s on a large
// app, so the budget is high enough that editing a page of 50,000 entries
// usually rebuilds it on the kept context. The docs app adds about 530 entries
// a page build, so this is about 900 page builds.
const contextMapBudget = 480000;

export default contextMapBudget;
