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
import {
  InvitationEmail,
  MagicLinkEmail,
  ResetPasswordEmail,
  VerifyEmail,
  interpolateProperties,
  renderEmail,
} from '@lowdefy/email-templates';

import getNotificationConfig from '../routes/notifications/getNotificationConfig.js';
import resolveThemeLogo from './resolveThemeLogo.js';

const stockTemplates = {
  verifyEmail: VerifyEmail,
  resetPassword: ResetPasswordEmail,
  magicLink: MagicLinkEmail,
  invitation: InvitationEmail,
};

// Single render path for the four auth email flows. Resolves the flow's template
// (a stock component by default, or an app-configured override notification when
// auth.email.templates[flow] names one), applies the app.email brand, and returns
// { subject, html, text }. Pure render — it never sends.
async function renderAuthEmail({ flow, vars, authEmailConfig, baseURL, context }) {
  const app = (await context.readConfigFile('app.json')) ?? {};
  const basePath = context.config?.basePath ?? '';
  // baseURL is the pinned origin the caller resolved; without a usable origin
  // string relative logos cannot be fetched by an email client, so they drop.
  const serverUrl = type.isString(baseURL) ? baseURL : undefined;

  const notificationId = authEmailConfig?.templates?.[flow];

  if (type.isString(notificationId)) {
    const notificationConfig = await getNotificationConfig(context, { notificationId });
    const Template = context.notifications?.[notificationConfig.type];
    if (!Template) {
      throw new ConfigError(
        `Notification template type "${notificationConfig.type}" can not be found.`,
        { configKey: notificationConfig['~k'] }
      );
    }
    // Resolve after the merge so a per-notification theme.logo override also
    // resolves; precedence stays notification theme over app.email.
    const theme = resolveThemeLogo({
      theme: { ...(app.email ?? {}), ...(notificationConfig.theme ?? {}) },
      serverUrl,
      basePath,
    });
    const interpolated = interpolateProperties({
      properties: notificationConfig.properties,
      data: vars,
      markdownProperties: Template.markdownProperties ?? [],
    });
    const { html, text } = await renderEmail({
      Template,
      properties: interpolated,
      data: vars,
      theme,
      links: {},
    });
    return { subject: interpolated.subject, html, text, notificationId };
  }

  const Template = stockTemplates[flow];
  if (!Template) {
    throw new ConfigError(`Unknown auth email flow "${flow}".`);
  }
  const theme = resolveThemeLogo({ theme: app.email ?? {}, serverUrl, basePath });
  const { html, text } = await renderEmail({
    Template,
    properties: vars,
    data: vars,
    theme,
    links: {},
  });
  const subject = type.isFunction(Template.subject) ? Template.subject(vars) : Template.subject;
  return { subject, html, text, notificationId: null };
}

export default renderAuthEmail;
