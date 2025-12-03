<TITLE>
_base64
</TITLE>

<METADATA>
env: Server Only
</METADATA>

<DESCRIPTION>
The `_base64` operator converts strings to and from [Base64](https://en.wikipedia.org/wiki/Base64) encoding format on the server side. Base64 is commonly used to encode binary data as ASCII text for safe transmission in APIs, databases, and other text-based protocols.

This operator provides two methods:

- `encode`: Converts a UTF-8 string to Base64 format
- `decode`: Converts a Base64 string back to UTF-8 format

> **Note**: This server-side version uses Node.js Buffer for encoding/decoding, which handles UTF-8 characters correctly. Use this operator in connections, requests, and API routines.
> </DESCRIPTION>

<SCHEMA>
```yaml
_base64.encode:
  type: string
  description: The UTF-8 string to encode to Base64.
  returns: string

\_base64.decode:
type: string
description: The Base64 string to decode to UTF-8.
returns: string

````
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic string encoding
Encode a string value to Base64 for API transmission.

```yaml
id: encode_api_key
type: AxiosHttp
connectionId: external_api
properties:
  headers:
    Authorization:
      _string.concat:
        - 'Basic '
        - _base64.encode:
            _string.concat:
              - _secret: API_USERNAME
              - ':'
              - _secret: API_PASSWORD
````

Returns: Base64-encoded credentials for Basic Auth header.

---

###### Example 2: Decoding configuration from environment

Decode Base64-encoded configuration from environment variables.

```yaml
# Environment: LOWDEFY_SECRET_DB_CONFIG=eyJob3N0IjogImRiLmV4YW1wbGUuY29tIiwgInBvcnQiOiAyNzAxN30=

connections:
  - id: database
    type: MongoDBCollection
    properties:
      databaseUri:
        _string.concat:
          - 'mongodb://'
          - _json.parse:
              _base64.decode:
                _secret: DB_CONFIG
```

---

###### Example 3: Encoding payload data for webhook

Prepare data for a webhook that requires Base64-encoded payloads.

```yaml
id: send_webhook
type: AxiosHttp
connectionId: webhook_service
properties:
  method: POST
  data:
    event_type: user_created
    payload:
      _base64.encode:
        _json.stringify:
          user_id:
            _payload: user_id
          email:
            _payload: email
          created_at:
            _date: now
```

---

###### Example 4: Processing encoded file content in API routines

Handle Base64-encoded file data within an API routine.

```yaml
id: process-file-upload
type: Api
routine:
  - :set_state:
      file_content:
        _base64.decode:
          _payload: file_base64
      file_name:
        _payload: file_name

  - id: validate_content
    type: MongoDBInsertOne
    connectionId: files
    properties:
      doc:
        name:
          _payload: file_name
        content:
          _state: file_content
        size:
          _string.length:
            _state: file_content
        uploaded_by:
          _user: id
        uploaded_at:
          _date: now

  - :return:
      success: true
      file_id:
        _step: validate_content.insertedId
```

---

###### Example 5: Creating signed tokens with encoded data

Build encoded tokens for secure data transmission.

```yaml
id: generate-signed-link
type: Api
routine:
  - :set_state:
      token_data:
        user_id:
          _payload: user_id
        expires:
          _sum:
            - _date.valueOf:
                _date: now
            - 86400000 # 24 hours in milliseconds
        permissions:
          _payload: permissions

  - :set_state:
      encoded_token:
        _base64.encode:
          _json.stringify:
            _state: token_data

  - :set_state:
      signature:
        _hash.sha256:
          _string.concat:
            - _state: encoded_token
            - _secret: TOKEN_SECRET

  - :return:
      signed_url:
        _string.concat:
          - 'https://api.example.com/verify?token='
          - _state: encoded_token
          - '&sig='
          - _state: signature
      expires_at:
        _state: token_data.expires
```

</EXAMPLES>
