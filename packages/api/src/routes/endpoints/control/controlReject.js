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

async function controlReject(context, routineContext, { control }) {
  const { evaluateOperators } = context;
  const { items } = routineContext;

  const message = evaluateOperators({ input: control[':reject'], items, location: 'TODO' });
  const cause = evaluateOperators({ input: control[':cause'], items, location: 'TODO' });
  const error = new Error(message, { cause });

  context.logger.debug({
    event: 'debug_control_reject',
    error,
  });
  return {
    status: 'reject',
    error,
  };
}

export default controlReject;
