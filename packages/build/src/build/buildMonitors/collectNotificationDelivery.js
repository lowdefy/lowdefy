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

// Who sends a notification is not on the notification - it is on whatever uses
// it. Two callers exist: a RenderNotification step in an endpoint routine (the
// app sends the rendered result with the next request step), and the auth email
// flows, which the framework sends itself through auth.email.connectionId.
// Both are read here so a monitor entry can name the delivery owner instead of
// saying "unknown".
const authFlows = ['verifyEmail', 'resetPassword', 'magicLink', 'invitation'];

function walkSteps(node, visit) {
  if (type.isArray(node)) {
    node.forEach((item) => walkSteps(item, visit));
    return;
  }
  if (!type.isObject(node)) return;
  if (node.type === 'RenderNotification') visit(node);
  // Controls nest their routines under keys like ":then" and ":do", and a
  // :switch nests them one level deeper again. Walking every value reaches all
  // of them without restating the control grammar here.
  Object.values(node).forEach((value) => walkSteps(value, visit));
}

function collectNotificationDelivery({ components }) {
  const delivery = new Map();
  const dynamicEndpoints = [];

  function entry(notificationId) {
    if (!delivery.has(notificationId)) {
      delivery.set(notificationId, { endpoints: [], auth_flows: [] });
    }
    return delivery.get(notificationId);
  }

  (components.api ?? []).forEach((endpoint) => {
    if (type.isNone(endpoint?.endpointId)) return;
    walkSteps(endpoint.routine, (step) => {
      const notificationId = step.properties?.notificationId;
      // An id built by an operator is only known at run time, so the build
      // cannot say which notification this endpoint delivers.
      if (!type.isString(notificationId)) {
        if (!dynamicEndpoints.includes(endpoint.endpointId)) {
          dynamicEndpoints.push(endpoint.endpointId);
        }
        return;
      }
      const endpoints = entry(notificationId).endpoints;
      if (!endpoints.includes(endpoint.endpointId)) endpoints.push(endpoint.endpointId);
    });
  });

  const templates = components.auth?.email?.templates ?? {};
  authFlows.forEach((flow) => {
    const notificationId = templates[flow];
    if (!type.isString(notificationId)) return;
    entry(notificationId).auth_flows.push(flow);
  });

  return { delivery, dynamicEndpoints, authConnectionId: components.auth?.email?.connectionId };
}

export default collectNotificationDelivery;
