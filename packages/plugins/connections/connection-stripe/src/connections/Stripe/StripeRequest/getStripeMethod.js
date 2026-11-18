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

import { type } from '@lowdefy/helpers';

// Resources (`customers`, `checkout.sessions`) are own properties of the client, but their
// methods live on each resource's class prototype, which the helpers `get` does not read. So the
// resource path is walked over own properties and the method is read through the prototype.
// Underscored members (`_makeRequest`) are SDK internals, and Object.prototype members
// (`constructor`, `toString`) are not Stripe API methods.
function getStripeMethod({ stripe, path }) {
  const resourcePath = path.slice(0, -1);
  const methodName = path[path.length - 1];
  const invalid = new Error(`Invalid Stripe method ${path.join('.')}`);

  let resource = stripe;
  for (const key of resourcePath) {
    if (!Object.hasOwn(resource, key) || !type.isObject(resource[key])) {
      throw invalid;
    }
    resource = resource[key];
  }

  if (methodName.startsWith('_') || methodName in Object.prototype) {
    throw invalid;
  }
  const method = resource[methodName];
  if (typeof method !== 'function') {
    throw invalid;
  }
  return { method, resource };
}

export default getStripeMethod;
