/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { validControlKey, getMissingRequiredControls, getInvalidControls } from './controlKeys.js';

function validateControl(control, { endpointId }) {
  const keys = Object.keys(control);
  if (!validControlKey(keys[0])) {
    throw new Error(
      `Invalid control type for endpoint ${endpointId}. Received ${JSON.stringify(keys[0])}`
    );
  }
  const missingRequiredControls = getMissingRequiredControls(keys);
  if (missingRequiredControls.length > 0) {
    throw new Error(
      `Missing required control type(s) for endpoint ${endpointId}. Missing ${JSON.stringify(
        missingRequiredControls
      )}`
    );
  }

  const invalidControls = getInvalidControls(keys);
  if (invalidControls.length > 0) {
    throw new Error(
      `Invalid control type(s) for endpoint ${endpointId}. Received ${JSON.stringify(
        invalidControls
      )}`
    );
  }
}

export default validateControl;
