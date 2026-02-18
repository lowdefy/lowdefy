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

function extractErrorProps(err) {
  if (!err) return err;
  const props = { message: err.message, name: err.name, stack: err.stack };
  if (err.cause !== undefined) {
    props.cause = err.cause instanceof Error ? extractErrorProps(err.cause) : err.cause;
  }
  for (const key of Object.keys(err)) {
    props[key] = err[key];
  }
  return props;
}

export default extractErrorProps;
