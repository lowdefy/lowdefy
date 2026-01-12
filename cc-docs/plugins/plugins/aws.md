# @lowdefy/plugin-aws

AWS integration plugin for Lowdefy.

## Overview

This plugin provides:
- S3 bucket connections
- S3 file operations
- AWS authentication helpers

## S3 Connection

### Connection Type

| Type | Purpose |
|------|---------|
| `S3Bucket` | Connect to S3 bucket |

### Configuration

```yaml
connections:
  - id: s3
    type: S3Bucket
    properties:
      region: us-east-1
      bucket: my-bucket
      accessKeyId:
        _secret: AWS_ACCESS_KEY_ID
      secretAccessKey:
        _secret: AWS_SECRET_ACCESS_KEY
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `region` | string | AWS region |
| `bucket` | string | Bucket name |
| `accessKeyId` | string | AWS access key |
| `secretAccessKey` | string | AWS secret key |
| `endpoint` | string | Custom endpoint (for S3-compatible services) |

## S3 Request Types

### S3GetObject

Download file from S3:

```yaml
requests:
  - id: getFile
    type: S3GetObject
    connectionId: s3
    properties:
      key: uploads/document.pdf
```

### S3PutObject

Upload file to S3:

```yaml
requests:
  - id: uploadFile
    type: S3PutObject
    connectionId: s3
    properties:
      key:
        _string:
          - 'uploads/'
          - _state: fileName
      body:
        _state: fileContent
      contentType:
        _state: fileType
```

### S3DeleteObject

Delete file from S3:

```yaml
requests:
  - id: deleteFile
    type: S3DeleteObject
    connectionId: s3
    properties:
      key:
        _state: fileKey
```

### S3ListObjects

List files in bucket:

```yaml
requests:
  - id: listFiles
    type: S3ListObjects
    connectionId: s3
    properties:
      prefix: uploads/
      maxKeys: 100
```

### S3PresignedGetUrl

Generate presigned download URL:

```yaml
requests:
  - id: getDownloadUrl
    type: S3PresignedGetUrl
    connectionId: s3
    properties:
      key:
        _state: fileKey
      expiresIn: 3600    # seconds
```

### S3PresignedPutUrl

Generate presigned upload URL:

```yaml
requests:
  - id: getUploadUrl
    type: S3PresignedPutUrl
    connectionId: s3
    properties:
      key:
        _string:
          - 'uploads/'
          - _uuid: v4
          - '.pdf'
      expiresIn: 3600
```

## Client-Side Upload Pattern

1. Get presigned URL from server
2. Upload directly to S3 from browser
3. Save file reference in database

```yaml
# Get upload URL
requests:
  - id: getUploadUrl
    type: S3PresignedPutUrl
    connectionId: s3
    properties:
      key:
        _string:
          - 'uploads/'
          - _uuid: v4

# Upload action
events:
  onFileSelected:
    - id: getUrl
      type: Request
      params:
        requestId: getUploadUrl
    - id: upload
      type: Fetch
      params:
        url:
          _request: getUploadUrl.url
        method: PUT
        body:
          _event: file
```

## IAM Permissions

Required S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ]
    }
  ]
}
```
