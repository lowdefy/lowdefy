<TITLE>
_secret
</TITLE>

<METADATA>
env: Server Only
</METADATA>

<DESCRIPTION>
The `_secret` operator retrieves sensitive values from the secrets object, which is populated from environment variables on the server. Secrets are read from environment variables that start with `LOWDEFY_SECRET_` prefix.

**Environment Variable Naming:**
- Set `LOWDEFY_SECRET_MY_API_KEY=abc123` in your environment
- Access it with `_secret: MY_API_KEY`

**Security Features:**
- Secrets are never sent to the client
- Getting all secrets with `_secret: true` is explicitly blocked for security
- OpenID Connect and JWT secrets are automatically filtered out

**JSON Secrets:**
Since environment variables are strings, you can store JSON-encoded values and parse them using [`_json.parse`](/_json):

```yaml
_json.parse:
  _secret: DATABASE_CONFIG
```

> **Important**: Only use `_secret` in server-side contexts like connections, requests, and API routines. Never expose secrets in client-side configuration.
</DESCRIPTION>

<SCHEMA>
```yaml
_secret:
  type: string | object
  description: Access values from the server secrets object.
  oneOf:
    - type: string
      description: The secret key to retrieve (without the LOWDEFY_SECRET_ prefix).
    - type: object
      properties:
        key:
          type: string
          description: The secret key to retrieve.
        default:
          type: any
          description: Value to return if the secret is not found.
  note: Using `_secret: true` or `all: true` is not allowed for security reasons.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Database connection with secrets
Configure a database connection using secret credentials.

```yaml
connections:
  - id: main_database
    type: MongoDBCollection
    properties:
      collection: users
      databaseUri:
        _secret: MONGODB_URI
      databaseName:
        _secret:
          key: MONGODB_DATABASE
          default: app_production
```

---

###### Example 2: API authentication headers
Use secrets for API key authentication.

```yaml
connections:
  - id: payment_gateway
    type: AxiosHttp
    properties:
      baseURL:
        _secret: PAYMENT_API_URL
      headers:
        Authorization:
          _string.concat:
            - 'Bearer '
            - _secret: PAYMENT_API_KEY
        X-API-Version: '2024-01'

  - id: email_service
    type: AxiosHttp
    properties:
      baseURL: https://api.sendgrid.com/v3
      headers:
        Authorization:
          _string.concat:
            - 'Bearer '
            - _secret: SENDGRID_API_KEY
        Content-Type: application/json
```

---

###### Example 3: Multi-environment configuration
Use secrets with defaults for different environments.

```yaml
connections:
  - id: analytics_service
    type: AxiosHttp
    properties:
      baseURL:
        _secret:
          key: ANALYTICS_API_URL
          default: https://analytics.example.com/api
      headers:
        X-API-Key:
          _secret: ANALYTICS_API_KEY
      timeout:
        _secret:
          key: ANALYTICS_TIMEOUT_MS
          default: 5000
```

---

###### Example 4: S3 storage configuration
Configure cloud storage with secret credentials.

```yaml
connections:
  - id: document_storage
    type: AwsS3Bucket
    properties:
      accessKeyId:
        _secret: AWS_ACCESS_KEY_ID
      secretAccessKey:
        _secret: AWS_SECRET_ACCESS_KEY
      region:
        _secret:
          key: AWS_REGION
          default: us-east-1
      bucket:
        _secret: S3_BUCKET_NAME
      write: true

  - id: backup_storage
    type: AwsS3Bucket
    properties:
      accessKeyId:
        _secret: BACKUP_AWS_ACCESS_KEY_ID
      secretAccessKey:
        _secret: BACKUP_AWS_SECRET_ACCESS_KEY
      region:
        _secret: BACKUP_AWS_REGION
      bucket:
        _secret: BACKUP_S3_BUCKET
      write: true
```

---

###### Example 5: Complex secrets with JSON parsing
Handle structured configuration stored as JSON in environment variables.

```yaml
# Environment variable:
# LOWDEFY_SECRET_OAUTH_CONFIG={"client_id":"abc123","client_secret":"xyz789","redirect_uri":"https://app.example.com/callback"}

id: oauth-callback
type: Api
routine:
  - :set_state:
      oauth_config:
        _json.parse:
          _secret: OAUTH_CONFIG

  - id: exchange_code
    type: AxiosHttp
    connectionId: oauth_provider
    properties:
      method: POST
      url: /oauth/token
      data:
        grant_type: authorization_code
        code:
          _payload: code
        client_id:
          _state: oauth_config.client_id
        client_secret:
          _state: oauth_config.client_secret
        redirect_uri:
          _state: oauth_config.redirect_uri

  - :return:
      access_token:
        _step: exchange_code.access_token
      expires_in:
        _step: exchange_code.expires_in

# Using secrets in webhook signature verification
id: verify-webhook-signature
type: Api
routine:
  - :set_state:
      expected_signature:
        _hash.sha256:
          _string.concat:
            - _payload: timestamp
            - '.'
            - _json.stringify:
                _payload: body
            - '.'
            - _secret: WEBHOOK_SIGNING_SECRET

  - :if:
      _ne:
        - _payload: signature
        - _state: expected_signature
    :then:
      - :reject:
          error: Invalid signature
          status: 401

  - :return:
      verified: true

# Email service with multiple secrets
id: send-transactional-email
type: Api
routine:
  - id: send_email
    type: AxiosHttp
    connectionId: email_service
    properties:
      method: POST
      url: /mail/send
      data:
        personalizations:
          - to:
              - email:
                  _payload: recipient_email
        from:
          email:
            _secret: EMAIL_FROM_ADDRESS
          name:
            _secret:
              key: EMAIL_FROM_NAME
              default: System Notifications
        subject:
          _payload: subject
        content:
          - type: text/html
            value:
              _payload: html_content
        mail_settings:
          sandbox_mode:
            enable:
              _eq:
                - _secret:
                    key: EMAIL_SANDBOX_MODE
                    default: 'false'
                - 'true'

  - :return:
      sent: true
      message_id:
        _step: send_email.message_id
```

</EXAMPLES>
