# @lowdefy/plugin-csv

CSV parsing utilities for Lowdefy.

## Overview

Provides operators for CSV parsing and generation.

## Operators

| Operator | Purpose |
|----------|---------|
| `_csv_parse` | Parse CSV string to array |
| `_csv_stringify` | Convert array to CSV string |

## _csv_parse

Parse CSV string to array of objects:

```yaml
data:
  _csv_parse:
    csv:
      _state: csvInput
    options:
      header: true         # First row is headers
      skipEmptyLines: true
      delimiter: ','
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `header` | boolean | Use first row as headers |
| `skipEmptyLines` | boolean | Skip empty lines |
| `delimiter` | string | Field delimiter (default: ,) |
| `columns` | array | Specify column names |

### Output

With `header: true`:
```javascript
[
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' }
]
```

Without `header`:
```javascript
[
  ['name', 'email'],
  ['John', 'john@example.com'],
  ['Jane', 'jane@example.com']
]
```

## _csv_stringify

Convert array to CSV:

```yaml
csvOutput:
  _csv_stringify:
    data:
      _request: getData
    options:
      header: true
      columns:
        - key: name
          header: Name
        - key: email
          header: Email Address
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `header` | boolean | Include header row |
| `columns` | array | Column definitions |
| `delimiter` | string | Field delimiter |

## Use Cases

### Import CSV Data

```yaml
events:
  onFileUpload:
    - id: parse
      type: SetState
      params:
        importedData:
          _csv_parse:
            csv:
              _event: content
            options:
              header: true
```

### Export to CSV

```yaml
events:
  onExport:
    - id: generate
      type: SetState
      params:
        csvDownload:
          _csv_stringify:
            data:
              _request: getExportData
            options:
              header: true
```

### CSV File Download

Combine with Fetch action for download:

```yaml
events:
  onClick:
    - id: downloadCsv
      type: Fetch
      params:
        url:
          _string:
            - 'data:text/csv;charset=utf-8,'
            - _csv_stringify:
                data:
                  _request: getData
        download: export.csv
```
