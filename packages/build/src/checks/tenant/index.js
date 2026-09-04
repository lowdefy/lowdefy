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
import authoredTenantField from './authoredTenantField.js';
import noneWithoutTenantField from './noneWithoutTenantField.js';
import noneFromCaller from './noneFromCaller.js';
import noneSupersededByRunAs from './noneSupersededByRunAs.js';
import noneWriteWithoutTenantField from './noneWriteWithoutTenantField.js';
import requestStateEmpty from './requestStateEmpty.js';
import runAsScopeDiscarded from './runAsScopeDiscarded.js';
import unscopedInventory from './unscopedInventory.js';

// Design §4 P7.4, in rule order: F1, the discarded-scope warning and the
// `tenant: none` deprecation run on every build; F2-F4, the _state read and
// the R1 inventory run under `lowdefy check` only.
const tenantRules = [
  authoredTenantField,
  runAsScopeDiscarded,
  noneSupersededByRunAs,
  noneWithoutTenantField,
  noneFromCaller,
  noneWriteWithoutTenantField,
  requestStateEmpty,
  unscopedInventory,
];

export default tenantRules;
