# @lowdefy/connection-google-sheets

[Google Sheets API](https://developers.google.com/sheets/api/reference/rest) connection for Lowdefy.

## Connection Type

| Type | Purpose |
|------|---------|
| `GoogleSheet` | Connect to Google Sheets |

## Connection Configuration

```yaml
connections:
  - id: sheets
    type: GoogleSheet
    properties:
      apiKey:
        _secret: GOOGLE_API_KEY
      spreadsheetId: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

## Request Types

| Type | Purpose |
|------|---------|
| `GoogleSheetGetMany` | Read rows |
| `GoogleSheetGetOne` | Read single row |
| `GoogleSheetAppendOne` | Append row |
| `GoogleSheetUpdateOne` | Update row |
| `GoogleSheetDeleteOne` | Delete row |

## GoogleSheetGetMany

```yaml
requests:
  - id: getData
    type: GoogleSheetGetMany
    connectionId: sheets
    properties:
      sheetName: Sheet1
      range: A2:D100
```

## GoogleSheetAppendOne

```yaml
requests:
  - id: addRow
    type: GoogleSheetAppendOne
    connectionId: sheets
    properties:
      sheetName: Sheet1
      row:
        Name:
          _state: name
        Email:
          _state: email
        Date:
          _date: now
```

## Authentication Options

### API Key (Read-only)

```yaml
properties:
  apiKey:
    _secret: GOOGLE_API_KEY
```

### Service Account (Read/Write)

```yaml
properties:
  serviceAccountKey:
    _secret: GOOGLE_SERVICE_ACCOUNT_JSON
```
