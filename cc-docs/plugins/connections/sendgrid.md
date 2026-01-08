# @lowdefy/connection-sendgrid

SendGrid email connection for Lowdefy.

## Connection Type

| Type | Purpose |
|------|---------|
| `SendGrid` | Connect to SendGrid |

## Connection Configuration

```yaml
connections:
  - id: email
    type: SendGrid
    properties:
      apiKey:
        _secret: SENDGRID_API_KEY
```

## Request Type

| Type | Purpose |
|------|---------|
| `SendGridSend` | Send email |

## SendGridSend

```yaml
requests:
  - id: sendWelcome
    type: SendGridSend
    connectionId: email
    properties:
      to:
        _state: userEmail
      from: noreply@example.com
      subject: Welcome to Our App
      text: |
        Hi {{ name }},
        Welcome to our platform!
      html: |
        <h1>Hi {{ name }},</h1>
        <p>Welcome to our platform!</p>
      templateData:
        name:
          _state: userName
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `to` | string/array | Recipient(s) |
| `from` | string | Sender address |
| `subject` | string | Email subject |
| `text` | string | Plain text body |
| `html` | string | HTML body |
| `templateId` | string | SendGrid template ID |
| `templateData` | object | Template variables |

## Using Templates

```yaml
requests:
  - id: sendFromTemplate
    type: SendGridSend
    connectionId: email
    properties:
      to:
        _state: email
      from: noreply@example.com
      templateId: d-xxxxxxxxxxxxx
      templateData:
        first_name:
          _state: firstName
        order_id:
          _state: orderId
```
