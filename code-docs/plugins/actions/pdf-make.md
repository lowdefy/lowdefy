# @lowdefy/actions-pdf-make

PDF generation action using the pdfmake library (0.3). It runs in the browser only and downloads the file.

## How it calls pdfmake

`PdfMake.js` imports the browser build (`pdfmake/build/pdfmake.js`), a module-level singleton:

- The bundled Roboto files (`src/fonts/vfs_fonts.js`, generated from `pdfmake/build/vfs_fonts.js`; regenerate it when pdfmake updates its Roboto) are written into pdfmake's virtual file system once, on import.
- Every call sets the fonts (`Roboto` plus the `fonts` param) and the table layouts (`tableLayouts` param, or none) with `setFonts` / `setTableLayouts`, not `addFonts` / `addTableLayouts`, so one call's fonts and layouts do not carry into the next. pdfmake reads both synchronously in `createPdf`, so concurrent calls do not mix.
- `createPdf(docDefinition).download(filename)` returns a promise that settles when the file is handed to the browser, so build errors (missing font, failed image URL) reject the action.
- pdfmake 0.3 calls `pageBreakBefore(currentNode, nodeContainer)`, where `nodeContainer` only has getter methods. A `_function` reads its arguments through `_args`, which copies them and drops functions, so `adaptPageBreakBefore` resolves the getters and calls the app function with the pdfmake 0.2 arguments `(currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage)`.
- No URL access policy is set. Image and font URLs are fetched by the user's browser with the user's own network access, so the SSRF concern behind pdfmake's `setUrlAccessPolicy` (CVE-2026-26801) does not apply, and URL resources are cached per document by default since 0.3.14 (CVE-2026-119743).

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

| Param           | Type   | Description                                          |
| --------------- | ------ | ---------------------------------------------------- |
| `filename`      | string | Downloaded file name                                 |
| `docDefinition` | object | pdfmake document definition, passed through as it is |
| `fonts`         | object | Font definitions by name (URLs), added to Roboto     |
| `tableLayouts`  | object | Custom table layouts by name                         |

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
