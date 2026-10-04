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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

function isNonEmptyString(value) {
  return type.isString(value) && value !== '';
}

// Decides the organization binding a CallApi step's `organization` and
// `caller` properties (already evaluated) ask for. Returns null when the step
// names neither, so the target runs as the calling run does.
//
// A binding is accepted only in a trusted system run (a schedule, an auth
// hook, a webhook whose verifier passed, or a detached run dispatched from
// one): the bound run is a system run, so naming it from a signed-in caller's
// routine, a strategy caller's or an unverified webhook's would raise that run
// to system trust. A run already bound may restate its own binding but not
// name another organization or another caller.
function resolveCallBinding(context, { caller, configKey, organization, stepId }) {
  if (type.isNone(organization) && type.isNone(caller)) {
    return null;
  }
  if (type.isNone(organization)) {
    throw new ConfigError(
      `CallApi step "${stepId}" names a "caller" without an "organization". A stand-in caller only runs inside an organization binding.`,
      { configKey }
    );
  }
  if (!isNonEmptyString(organization)) {
    throw new ConfigError(
      `CallApi step "${stepId}" property "organization" should be a non-empty organization id string.`,
      { received: organization, configKey }
    );
  }
  if (
    !type.isNone(caller) &&
    (!type.isObject(caller) || !isNonEmptyString(caller.id) || !isNonEmptyString(caller.name))
  ) {
    throw new ConfigError(
      `CallApi step "${stepId}" property "caller" should be an object with non-empty string "id" and "name".`,
      { received: caller, configKey }
    );
  }
  if (context.system !== true) {
    throw new ConfigError(
      `CallApi step "${stepId}" names an "organization", which is accepted only in a trusted system run (a schedule, an auth hook, a webhook whose verifier passed, or a detached run from one). This run has a signed-in caller, or is a webhook with no passing verifier.`,
      { configKey }
    );
  }
  const named = type.isNone(caller) ? null : { id: caller.id, name: caller.name };
  if (type.isNone(context.boundOrganizationId)) {
    return { organizationId: organization, caller: named };
  }
  if (organization !== context.boundOrganizationId) {
    throw new ConfigError(
      `CallApi step "${stepId}" names organization "${organization}", but this run is already bound to organization "${context.boundOrganizationId}" and can not name another.`,
      { configKey }
    );
  }
  const current = type.isNone(context.user)
    ? null
    : { id: context.user.id, name: context.user.name };
  if (named === null) {
    return { organizationId: organization, caller: current };
  }
  if (current === null || named.id !== current.id) {
    throw new ConfigError(
      `CallApi step "${stepId}" names caller "${named.id}", but this run is already bound with ${
        current === null ? 'no caller' : `caller "${current.id}"`
      } and can not name another.`,
      { configKey }
    );
  }
  return { organizationId: organization, caller: named };
}

export default resolveCallBinding;
