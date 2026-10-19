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

// A request type names in meta.credentialProperties the request properties that carry a
// credential the secret scrub cannot recognise, such as a presigned link, whose signature is
// derived from a secret rather than being one. Their values are masked in the request properties
// an error keeps as received, so the error log never holds them.
function maskCredentialProperties({ requestProperties, requestResolver }) {
  const credentialProperties = requestResolver.meta.credentialProperties ?? [];
  if (credentialProperties.length === 0) {
    return requestProperties;
  }
  const masked = { ...requestProperties };
  credentialProperties.forEach((property) => {
    if (Object.hasOwn(masked, property)) {
      masked[property] = '[REDACTED]';
    }
  });
  return masked;
}

export default maskCredentialProperties;
