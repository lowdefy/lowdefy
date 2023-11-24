/*
  Copyright (C) 2023 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2027-10-09

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

function createLicenseRedirectCallback(context, license) {
  async function licenseRedirectCallback({ url, baseUrl }) {
    if (license.code !== 'VALID' || !license.entitlements.includes('AUTH')) {
      return '/lowdefy/license-invalid';
    }
    return context.authOptions.originalRedirectCallback({ url, baseUrl });
  }
  return licenseRedirectCallback;
}

export default createLicenseRedirectCallback;
