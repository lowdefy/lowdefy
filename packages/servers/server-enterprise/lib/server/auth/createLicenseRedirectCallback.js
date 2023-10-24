/*
  Copyright (C) 2023 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2027-10-09

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import validateLicense from '../validateLicense.js';

function defaultRedirect({ url, baseUrl }) {
  if (url.startsWith('/')) return `${baseUrl}${url}`;
  else if (new URL(url).origin === baseUrl) return url;
  return baseUrl;
}

function createLicenseRedirectCallback(context, { originalRedirect }) {
  async function licenseRedirectCallback({ url, baseUrl }) {
    const { redirect } = await validateLicense(context);

    if (redirect) {
      return '/lowdefy/license-invalid';
    }
    if (originalRedirect) {
      return originalRedirect({ url, baseUrl });
    }
    return defaultRedirect({ url, baseUrl });
  }
  return licenseRedirectCallback;
}

export default createLicenseRedirectCallback;
