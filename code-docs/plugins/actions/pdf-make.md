# @lowdefy/actions-pdf-make

PDF generation action using pdfmake library.

## Action

| Action    | Purpose                   |
| --------- | ------------------------- |
| `PdfMake` | Generate and download PDF |

## Usage

```yaml
- id: generatePdf
  type: PdfMake
  params:
    filename: report.pdf
    docDefinition:
      content:
        - text: Invoice
          style: header
        - text:
            _string:
              - 'Customer: '
              - _state: customerName
        - table:
            headerRows: 1
            widths:
              - '*'
              - 100
            body:
              - - Item
                - Price
              - - Product A
                - '$10.00'
              - - Product B
                - '$15.00'
      styles:
        header:
          fontSize: 18
          bold: true
          margin:
            - 0
            - 0
            - 0
            - 10
```

## Parameters

| Param           | Type   | Description                 |
| --------------- | ------ | --------------------------- |
| `filename`      | string | Downloaded file name        |
| `docDefinition` | object | pdfmake document definition |

## Document Definition

### Text

```yaml
content:
  - text: Simple text
  - text: Bold text
    bold: true
  - text: Large text
    fontSize: 20
```

### Tables

```yaml
content:
  - table:
      headerRows: 1
      widths:
        - '*' # Flexible
        - 100 # Fixed
        - auto # Content width
      body:
        - - Header 1
          - Header 2
          - Header 3
        - - Cell 1
          - Cell 2
          - Cell 3
```

### Lists

```yaml
content:
  - ul:
      - Item 1
      - Item 2
  - ol:
      - First
      - Second
```

### Columns

```yaml
content:
  - columns:
      - width: '*'
        text: Left column
      - width: '*'
        text: Right column
```

### Images

```yaml
content:
  - image: data:image/png;base64,...
    width: 150
```

### Styles

```yaml
docDefinition:
  content:
    - text: Styled text
      style: myStyle
  styles:
    myStyle:
      fontSize: 14
      bold: true
      color: '#333333'
```

## Dynamic Content

Use operators for dynamic data:

```yaml
params:
  docDefinition:
    content:
      - text:
          _string:
            - 'Report for '
            - _state: reportDate
      - table:
          body:
            _array:
              - - Name
                - Value
              - _map:
                  on:
                    _request: getData
                  iterate:
                    _array:
                      - _get:
                          from:
                            _args: 0
                          key: name
                      - _get:
                          from:
                            _args: 0
                          key: value
```

## Page Configuration

```yaml
docDefinition:
  pageSize: A4
  pageOrientation: portrait
  pageMargins:
    - 40
    - 60
    - 40
    - 60
  header:
    text: Company Name
    alignment: center
  footer:
    text:
      _string:
        - 'Page '
        - currentPage
        - ' of '
        - pageCount
```
