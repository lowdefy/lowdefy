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

/**
 * The keyboard and autofill props of a React Native TextInput for the web input `type`, so each
 * input opens the keyboard its value needs.
 *
 * @param {Object} params
 * @param {string} [params.type] 'text', 'number', 'password', 'tel', 'email' or 'url'.
 * @returns {Object} TextInput props.
 */
function getKeyboardProps({ type }) {
  switch (type) {
    case 'email':
      return {
        autoCapitalize: 'none',
        autoComplete: 'email',
        autoCorrect: false,
        keyboardType: 'email-address',
        textContentType: 'emailAddress',
      };
    case 'number':
      return { keyboardType: 'numeric' };
    case 'password':
      return {
        autoCapitalize: 'none',
        autoComplete: 'password',
        autoCorrect: false,
        secureTextEntry: true,
        textContentType: 'password',
      };
    case 'tel':
      return { autoComplete: 'tel', keyboardType: 'phone-pad', textContentType: 'telephoneNumber' };
    case 'url':
      return {
        autoCapitalize: 'none',
        autoComplete: 'url',
        autoCorrect: false,
        keyboardType: 'url',
        textContentType: 'URL',
      };
    default:
      return { keyboardType: 'default' };
  }
}

export default getKeyboardProps;
