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

import { test, expect } from '@playwright/test';
import { ldf, button, textInput, selector } from '@lowdefy/e2e-utils';

test.describe('Workflow Test - App Developer Style', () => {
  test('complete ticket creation workflow', async ({ page }) => {
    // Navigate to the workflow test page
    await ldf.goto(page, '/workflow-test');

    // Verify form is visible
    await textInput.assertions.isVisible(page, 'title_input');
    await textInput.assertions.hasPlaceholder(page, 'title_input', 'Enter ticket title');

    // Fill the form
    await textInput.fill(page, 'title_input', 'Login button not working');
    await textInput.fill(page, 'description_input', 'Users cannot log in after the latest update');
    await selector.select(page, 'priority_selector', 'High');

    // Verify form values via state
    await ldf.expectState(page, 'title_input', 'Login button not working');
    await ldf.expectState(page, 'priority_selector', 'high');

    // Submit the form
    await button.click(page, 'submit_btn');

    // Wait for the simulated processing (SetState with submitted: true)
    await page.waitForFunction(() => {
      const lowdefy = window.lowdefy;
      const pageId = lowdefy?.pageId;
      return lowdefy?.contexts?.[`page:${pageId}`]?.state?.submitted === true;
    });

    // Verify the result
    await ldf.expectState(page, 'ticket.status', 'open');
    await ldf.expectState(page, 'ticket.priority', 'high');

    // Verify result card is visible
    const successAlert = ldf.block(page, 'success_alert');
    await expect(successAlert).toBeVisible();

    // Reset and verify form is cleared
    await button.click(page, 'reset_btn');
    await ldf.expectState(page, 'submitted', false);
    await ldf.expectState(page, 'title_input', null);
  });

  test('form validation - empty submit shows correct state', async ({ page }) => {
    await ldf.goto(page, '/workflow-test');

    // Submit without filling form
    await button.click(page, 'submit_btn');

    // Wait for submission to complete
    await page.waitForFunction(() => {
      const lowdefy = window.lowdefy;
      const pageId = lowdefy?.pageId;
      return lowdefy?.contexts?.[`page:${pageId}`]?.state?.submitted === true;
    });

    // Verify ticket was created with null values
    await ldf.expectState(page, 'ticket.title', null);
    await ldf.expectState(page, 'ticket.priority', null);
  });

  test('selector interactions', async ({ page }) => {
    await ldf.goto(page, '/workflow-test');

    // Select a value
    await selector.select(page, 'priority_selector', 'Medium');
    await selector.assertions.hasValue(page, 'priority_selector', 'Medium');

    // Change selection
    await selector.select(page, 'priority_selector', 'Low');
    await selector.assertions.hasValue(page, 'priority_selector', 'Low');

    // Verify state updated
    await ldf.expectState(page, 'priority_selector', 'low');
  });

  test('button assertions', async ({ page }) => {
    await ldf.goto(page, '/workflow-test');

    // Check button is visible and has correct text
    await button.assertions.isVisible(page, 'submit_btn');
    await button.assertions.hasText(page, 'submit_btn', 'Submit Ticket');
    await button.assertions.hasType(page, 'submit_btn', 'primary');
  });

  test('read full page state', async ({ page }) => {
    await ldf.goto(page, '/workflow-test');

    // Fill some values
    await textInput.fill(page, 'title_input', 'Test title');
    await selector.select(page, 'priority_selector', 'High');

    // Get full state and verify structure
    const state = await ldf.getState(page);
    expect(state.title_input).toBe('Test title');
    expect(state.priority_selector).toBe('high');

    // Get individual block state
    const titleState = await ldf.getBlockState(page, 'title_input');
    expect(titleState).toBe('Test title');
  });
});
