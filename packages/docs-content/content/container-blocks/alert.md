# Alert

Alert banner with type, description, icon, and closable options.

> Operation completed successfully

> This is an informational message

> Please review before proceeding

> An error occurred during processing

```yaml
- id: type_success
  type: Alert
  properties:
    message: Operation completed successfully
    type: success
- id: type_info
  type: Alert
  properties:
    message: This is an informational message
    type: info
- id: type_warning
  type: Alert
  properties:
    message: Please review before proceeding
    type: warning
- id: type_error
  type: Alert
  properties:
    message: An error occurred during processing
    type: error
```

> Payment Received

> Scheduled Maintenance

> Storage Almost Full

> Connection Failed

```yaml
- id: desc_success
  type: Alert
  properties:
    message: Payment Received
    description: Your payment of $49.99 has been processed. A confirmation email has
      been sent to your inbox.
    type: success
- id: desc_info
  type: Alert
  properties:
    message: Scheduled Maintenance
    description: The system will undergo maintenance on Saturday from 2:00 AM to
      6:00 AM UTC. Please save your work beforehand.
    type: info
- id: desc_warning
  type: Alert
  properties:
    message: Storage Almost Full
    description: You have used 90% of your available storage. Consider upgrading
      your plan or removing unused files.
    type: warning
- id: desc_error
  type: Alert
  properties:
    message: Connection Failed
    description: Unable to connect to the database server. Please check your network
      settings and try again.
    type: error
```

> All systems operational

> Your session will expire in 30 minutes

> Unsaved changes will be lost

> Invalid credentials provided

```yaml
- id: msg_only_success
  type: Alert
  properties:
    message: All systems operational
    type: success
- id: msg_only_info
  type: Alert
  properties:
    message: Your session will expire in 30 minutes
    type: info
- id: msg_only_warning
  type: Alert
  properties:
    message: Unsaved changes will be lost
    type: warning
- id: msg_only_error
  type: Alert
  properties:
    message: Invalid credentials provided
    type: error
```

> Changes saved

> New version available

> Session expires in 5 minutes

> Request timed out

> Notice

```yaml
- id: noicon_success
  type: Alert
  properties:
    message: Changes saved
    type: success
    showIcon: false
- id: noicon_info
  type: Alert
  properties:
    message: New version available
    type: info
    showIcon: false
- id: noicon_warning
  type: Alert
  properties:
    message: Session expires in 5 minutes
    type: warning
    showIcon: false
- id: noicon_error
  type: Alert
  properties:
    message: Request timed out
    type: error
    showIcon: false
- id: noicon_desc
  type: Alert
  properties:
    message: Notice
    description: This alert has a description but no icon. The showIcon property is
      set to false, giving a cleaner text-only appearance.
    type: info
    showIcon: false
```

> You can dismiss this notification

> Profile updated successfully

> Your trial period ends in 3 days

> Failed to sync data

```yaml
- id: closable_info
  type: Alert
  properties:
    message: You can dismiss this notification
    type: info
    closable: true
- id: closable_success
  type: Alert
  properties:
    message: Profile updated successfully
    type: success
    closable: true
- id: closable_warning
  type: Alert
  properties:
    message: Your trial period ends in 3 days
    description: Upgrade to a paid plan to keep access to all features.
    type: warning
    closable: true
- id: closable_error
  type: Alert
  properties:
    message: Failed to sync data
    description: The last synchronization attempt failed. Your local changes have
      been preserved. Please check your connection and try again.
    type: error
    closable: true
```

> Cookie consent notice

> New features available

> Reminder to complete your profile

> Browser update recommended

```yaml
- id: close_text_dismiss
  type: Alert
  properties:
    message: Cookie consent notice
    description: We use cookies to improve your experience. By continuing to use
      this site, you agree to our cookie policy.
    type: info
    closable: true
    closeText: Dismiss
- id: close_text_gotit
  type: Alert
  properties:
    message: New features available
    description: We have added dark mode support and keyboard shortcuts. Check the
      settings page for details.
    type: success
    closable: true
    closeText: Got it
- id: close_text_close
  type: Alert
  properties:
    message: Reminder to complete your profile
    type: warning
    closable: true
    closeText: Close
- id: close_text_later
  type: Alert
  properties:
    message: Browser update recommended
    description: You are using an older browser version. Some features may not work
      as expected.
    type: warning
    closable: true
    closeText: Later
```

> All tests passed

> You have 3 new notifications

> Your session has been locked for security

> Bug detected in module

> Deployment in progress

> You earned a new achievement

> Custom styled icon

> Security scan complete

```yaml
- id: custom_icon_check
  type: Alert
  properties:
    message: All tests passed
    type: success
    icon: AiOutlineCheckCircle
- id: custom_icon_bell
  type: Alert
  properties:
    message: You have 3 new notifications
    type: info
    icon: AiOutlineBell
- id: custom_icon_lock
  type: Alert
  properties:
    message: Your session has been locked for security
    type: warning
    icon: AiOutlineLock
- id: custom_icon_bug
  type: Alert
  properties:
    message: Bug detected in module
    type: error
    icon: AiOutlineBug
- id: custom_icon_rocket
  type: Alert
  properties:
    message: Deployment in progress
    description: Your application is being deployed to the production environment.
      This usually takes 2-3 minutes.
    type: info
    icon: AiOutlineRocket
- id: custom_icon_star
  type: Alert
  properties:
    message: You earned a new achievement
    description: Congratulations on completing your first project!
    type: success
    icon: AiOutlineStar
- id: custom_icon_object
  type: Alert
  properties:
    message: Custom styled icon
    type: info
    icon:
      name: AiOutlineThunderbolt
      color: "#faad14"
- id: custom_icon_colored_obj
  type: Alert
  properties:
    message: Security scan complete
    description: No vulnerabilities were detected in your dependencies.
    type: success
    icon:
      name: AiOutlineSafety
      color: "#52c41a"
```

> Deployment completed successfully across all regions

> Welcome to the new dashboard experience

> Your account requires verification to continue

> Service disruption detected in the EU region

> This banner can be dismissed by the user

> System Update Scheduled

```yaml
- id: banner_success
  type: Alert
  properties:
    message: Deployment completed successfully across all regions
    type: success
    banner: true
- id: banner_info
  type: Alert
  properties:
    message: Welcome to the new dashboard experience
    type: info
    banner: true
- id: banner_warning
  type: Alert
  properties:
    message: Your account requires verification to continue
    type: warning
    banner: true
- id: banner_error
  type: Alert
  properties:
    message: Service disruption detected in the EU region
    type: error
    banner: true
- id: banner_closable
  type: Alert
  properties:
    message: This banner can be dismissed by the user
    type: info
    banner: true
    closable: true
- id: banner_desc
  type: Alert
  properties:
    message: System Update Scheduled
    description: A major update is scheduled for this weekend. All services will be
      briefly unavailable during the migration window from 01:00 to 03:00 UTC on
      Sunday.
    type: warning
    banner: true
```

> <b>Important:</b> Your password expires in <b>7 days</b>

> Click <a href="https://lowdefy.com" target="_blank">here</a> to learn more about Lowdefy

> Release Notes v4.2.0

> <span style="font-size: 16px;">Account Status: <span style="color: #52c41a; font-weight: bold;">Active</span></span>

> Configuration Error

> Data Migration Complete

```yaml
- id: html_bold_message
  type: Alert
  properties:
    message: <b>Important:</b> Your password expires in <b>7 days</b>
    type: warning
- id: html_link_message
  type: Alert
  properties:
    message: Click <a href="https://lowdefy.com" target="_blank">here</a> to learn
      more about Lowdefy
    type: info
- id: html_rich_description
  type: Alert
  properties:
    message: Release Notes v4.2.0
    description: <ul><li><b>New:</b> Dark mode support</li><li><b>Fixed:</b> Login
      timeout issue</li><li><b>Improved:</b> Dashboard loading speed by
      40%</li></ul>
    type: success
- id: html_styled_message
  type: Alert
  properties:
    message: '<span style="font-size: 16px;">Account Status: <span style="color:
      #52c41a; font-weight: bold;">Active</span></span>'
    type: info
    showIcon: false
- id: html_code_description
  type: Alert
  properties:
    message: Configuration Error
    description: The field <code>database.host</code> is required but was not
      provided. Please update your <code>.env</code> file and restart the
      server.
    type: error
- id: html_emphasis_description
  type: Alert
  properties:
    message: Data Migration Complete
    description: <em>All 15,432 records</em> have been migrated to the new schema.
      <strong>No data loss detected.</strong> Please verify the results in the
      admin panel.
    type: success
```

> A new software update is available

> Your subscription is about to expire

> Payment processing failed

> Merge conflict detected

> Export completed

```yaml
- id: action_button_info
  type: Alert
  properties:
    message: A new software update is available
    description: Version 2.5.0 includes bug fixes and performance improvements.
    type: info
  slots:
    action:
      blocks:
        - id: action_button_info_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Update Now
            color: primary
            variant: solid
            size: small
- id: action_button_warning
  type: Alert
  properties:
    message: Your subscription is about to expire
    description: Renew before March 15 to keep your current pricing.
    type: warning
  slots:
    action:
      blocks:
        - id: action_button_warning_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Renew
            color: primary
            variant: outlined
            size: small
- id: action_button_error
  type: Alert
  properties:
    message: Payment processing failed
    description: Your credit card was declined. Please update your payment method to
      avoid service interruption.
    type: error
  slots:
    action:
      blocks:
        - id: action_button_error_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Update Payment
            color: danger
            variant: solid
            size: small
- id: action_multiple_buttons
  type: Alert
  properties:
    message: Merge conflict detected
    description: The branch feature/auth has conflicts with main that need to be
      resolved manually.
    type: warning
  slots:
    action:
      blocks:
        - id: action_multi_row
          type: Box
          layout:
            gap: 8
          blocks:
            - id: action_multi_resolve
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Resolve
                color: primary
                variant: solid
                size: small
            - id: action_multi_dismiss
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Dismiss
                color: default
                variant: outlined
                size: small
- id: action_link_success
  type: Alert
  properties:
    message: Export completed
    description: Your data export is ready for download.
    type: success
  slots:
    action:
      blocks:
        - id: action_link_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Download
            icon: AiOutlineDownload
            color: green
            variant: solid
            size: small
```

> Backup Completed

> API Rate Limit Warning

> Critical Security Alert

> Welcome to the beta program! We appreciate your feedback.

> Terms of Service Updated

```yaml
- id: combo_full_success
  type: Alert
  properties:
    message: Backup Completed
    description: All 248 files have been backed up to cloud storage. Total size 1.2 GB.
    type: success
    closable: true
    closeText: OK
    icon: AiOutlineCloudUpload
- id: combo_full_warning
  type: Alert
  properties:
    message: API Rate Limit Warning
    description: You have used 85% of your daily API quota (8,500 / 10,000
      requests). Consider implementing request caching.
    type: warning
    closable: true
    icon: AiOutlineApi
- id: combo_full_error
  type: Alert
  properties:
    message: Critical Security Alert
    description: <b>Unauthorized access attempt detected</b> from IP
      <code>192.168.1.45</code> at 14:32 UTC. The account has been temporarily
      locked.
    type: error
    closable: true
    icon: AiOutlineWarning
- id: combo_banner_closable_icon
  type: Alert
  properties:
    message: Welcome to the beta program! We appreciate your feedback.
    type: info
    banner: true
    closable: true
    icon: AiOutlineExperiment
- id: combo_noicon_closable_desc
  type: Alert
  properties:
    message: Terms of Service Updated
    description: Our terms of service have been updated effective March 1, 2026. By
      continuing to use the platform, you agree to the new terms.
    type: info
    showIcon: false
    closable: true
    closeText: I Agree
```

> Rounded with shadow

> Left border accent

> Elevated success

> Alert on dark background

> Warning on dark background

> Compact alert with smaller text

> Wider border radius

```yaml
- id: css_rounded
  type: Alert
  class: rounded-xl shadow-md
  properties:
    message: Rounded with shadow
    description: This alert uses Tailwind classes for rounded corners and a shadow effect.
    type: info
- id: css_border_accent
  type: Alert
  class: border-l-4 border-l-blue-500
  properties:
    message: Left border accent
    description: A thicker left border creates a visual accent effect, drawing
      attention to the alert content.
    type: info
    showIcon: false
- id: css_shadow_success
  type: Alert
  class: shadow-lg rounded-lg
  properties:
    message: Elevated success
    description: Shadow and border radius create a card-like elevated appearance for
      this success alert.
    type: success
- id: css_dark_bg
  type: Box
  class: bg-bg-layout p-6 rounded-xl
  blocks:
    - id: css_on_dark_info
      type: Alert
      class: shadow-xl
      properties:
        message: Alert on dark background
        description: Alerts with shadows stand out well against darker container
          backgrounds.
        type: info
    - id: css_on_dark_warning
      type: Alert
      class: shadow-xl
      properties:
        message: Warning on dark background
        type: warning
- id: css_compact
  type: Alert
  class: text-xs
  properties:
    message: Compact alert with smaller text
    type: info
    showIcon: false
- id: css_wide_border
  type: Alert
  class: border-2 rounded-2xl
  properties:
    message: Wider border radius
    description: Extra border width and larger radius for a softer appearance.
    type: success
```

> Large border radius

> Larger font size

> Extra padding

> Sharp corners (no radius)

> Larger description icon

> Fully customized alert

```yaml
- id: theme_custom_radius
  type: Alert
  properties:
    message: Large border radius
    description: This alert uses a 16px border radius override via the theme property.
    type: info
    theme:
      borderRadius: 16
- id: theme_custom_font
  type: Alert
  properties:
    message: Larger font size
    description: The base font size is increased to 16px for improved readability.
    type: success
    theme:
      fontSize: 16
- id: theme_custom_padding
  type: Alert
  properties:
    message: Extra padding
    description: Custom padding makes the alert feel more spacious and prominent on
      the page.
    type: warning
    theme:
      defaultPadding: 16px 24px
      withDescriptionPadding: 28px 32px
- id: theme_no_radius
  type: Alert
  properties:
    message: Sharp corners (no radius)
    description: Setting borderRadius to 0 creates a sharp-edged industrial look.
    type: info
    theme:
      borderRadius: 0
- id: theme_large_icon
  type: Alert
  properties:
    message: Larger description icon
    description: The icon size for alerts with descriptions is increased to 32px,
      making it more prominent.
    type: success
    theme:
      withDescriptionIconSize: 32
- id: theme_combined
  type: Alert
  properties:
    message: Fully customized alert
    description: This alert combines multiple theme token overrides including
      padding, radius, font size, and icon size for a completely custom
      appearance.
    type: info
    theme:
      borderRadius: 12
      fontSize: 15
      withDescriptionPadding: 24px 28px
      withDescriptionIconSize: 28
```

> Please fix the following errors

> Welcome to your workspace!

> API v1 Deprecation Notice

> Scheduled Downtime

> Deployment Successful

> Resource Quota Warning

> Access Denied

> Beta Feature Enabled

```yaml
- id: real_form_validation
  type: Alert
  properties:
    message: Please fix the following errors
    description: <ul><li>Email address is required</li><li>Password must be at least
      8 characters</li><li>Please agree to the terms of service</li></ul>
    type: error
    icon: AiOutlineExclamationCircle
- id: real_onboarding
  type: Alert
  properties:
    message: Welcome to your workspace!
    description: Get started by creating your first project. You can invite team
      members from the Settings page.
    type: info
    closable: true
    icon: AiOutlineSmile
  slots:
    action:
      blocks:
        - id: real_onboarding_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Create Project
            color: primary
            variant: solid
            size: small
            icon: AiOutlinePlus
- id: real_deprecation
  type: Alert
  properties:
    message: API v1 Deprecation Notice
    description: API v1 will be sunset on <b>June 30, 2026</b>. Please migrate to
      API v2 before this date. See the <a href="#">migration guide</a> for
      instructions.
    type: warning
    closable: true
    closeText: Acknowledged
    icon: AiOutlineClockCircle
- id: real_maintenance
  type: Alert
  properties:
    message: Scheduled Downtime
    description: Services will be unavailable on Sunday, March 15 from 02:00 to
      04:00 UTC for database migration. No action is required on your part.
    type: info
    banner: true
    closable: true
- id: real_success_deploy
  type: Alert
  properties:
    message: Deployment Successful
    description: "Application <b>my-app</b> has been deployed to
      <code>production</code> environment. Build #1847 completed in 2m 34s."
    type: success
    icon: AiOutlineCheckCircle
  slots:
    action:
      blocks:
        - id: real_deploy_actions
          type: Box
          layout:
            gap: 8
          blocks:
            - id: real_deploy_view
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: View Logs
                color: default
                variant: outlined
                size: small
            - id: real_deploy_open
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Open App
                color: green
                variant: solid
                size: small
                icon: AiOutlineLink
- id: real_quota_warning
  type: Alert
  properties:
    message: Resource Quota Warning
    description: "Your project has used <b>92%</b> of allocated compute resources.
      Current usage: 18.4 / 20 vCPUs. Consider scaling your plan or optimizing
      workloads."
    type: warning
    icon: AiOutlineDashboard
  slots:
    action:
      blocks:
        - id: real_quota_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Upgrade Plan
            color: primary
            variant: solid
            size: small
- id: real_permission_error
  type: Alert
  properties:
    message: Access Denied
    description: You do not have permission to view this resource. Contact your
      administrator to request access to the Analytics dashboard.
    type: error
    icon: AiOutlineStop
    closable: true
- id: real_feature_flag
  type: Alert
  properties:
    message: Beta Feature Enabled
    description: You are using an experimental feature. Some functionality may be
      unstable. Please report any issues you encounter.
    type: info
    closable: true
    closeText: Understood
    icon: AiOutlineExperiment
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `banner` | boolean | `false` | Style as banner at top of application window. |
| `closable` | boolean | `false` | Allow alert to be closed. |
| `closeText` | string | - | Close text to show. |
| `description` | string | - | Content description of alert - supports html. |
| `icon` | string \| object | - | Name of an Ant Design Icon or properties of an Icon block to customize alert icon. |
| `message` | string | - | Content message of alert - supports html. |
| `showIcon` | boolean | `true` | Show type default icon. |
| `type` | string | `"info"` | Alert style type. Enum: `success`, `info`, `warning`, `error`. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design alert tokens](https://ant.design/components/alert#design-token). |
| `theme.defaultPadding` | string | `"8px 12px"` | Default padding for the alert without description. |
| `theme.withDescriptionPadding` | string | `"20px 24px"` | Padding for the alert when a description is present. |
| `theme.withDescriptionIconSize` | number | `24` | Icon size when the alert has a description. |
| `theme.colorText` | string | - | Text color of the alert message. |
| `theme.colorTextHeading` | string | - | Heading text color when the alert has a description. |
| `theme.colorIcon` | string | - | Icon color override. |
| `theme.colorIconHover` | string | - | Icon hover color for the close button. |
| `theme.fontSize` | number | `14` | Font size of the alert text. |
| `theme.fontSizeLG` | number | `16` | Font size of the alert message when a description is present. |
| `theme.lineHeight` | number | `1.5714` | Line height of the alert text. |
| `theme.borderRadius` | number | `8` | Border radius of the alert container. |
| `theme.borderRadiusLG` | number | `8` | Border radius for large alerts. |
| `theme.colorSuccessBg` | string | - | Background color for success alerts. |
| `theme.colorSuccessBorder` | string | - | Border color for success alerts. |
| `theme.colorInfoBg` | string | - | Background color for info alerts. |
| `theme.colorInfoBorder` | string | - | Border color for info alerts. |
| `theme.colorWarningBg` | string | - | Background color for warning alerts. |
| `theme.colorWarningBorder` | string | - | Border color for warning alerts. |
| `theme.colorErrorBg` | string | - | Background color for error alerts. |
| `theme.colorErrorBorder` | string | - | Border color for error alerts. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onClose` | \- | Called when Alert close button is clicked. |
| `afterClose` | \- | Called after Alert has been closed. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Alert element. |
| `/icon` | The icon in the Alert. |
| `/message` | The Alert message. |
| `/description` | The Alert description. |
| `/action` | The Alert action. |
| `/closeIcon` | The Alert close icon. |

| Slot | Description |
| --- | --- |
| `action` | Action area content. |
