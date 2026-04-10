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

const formatPhoneNumber = (dialCode = '', input) => {
  // Strip all non-digit characters from input, then strip leading zeros
  const cleanInput = (input || '').replace(/\D/g, '').replace(/^0+/, '');

  // If the cleaned input is empty, return an empty string
  if (cleanInput.length === 0) {
    return '';
  }
  // Concatenate the cleaned dial code and input
  return `${dialCode}${cleanInput}`;
};

export default formatPhoneNumber;
