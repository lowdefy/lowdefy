<TITLE>
PdfMake
</TITLE>

<DESCRIPTION>
The `PdfMake` action is used to generate and download a PDF file from a set of defined content using the [pdfMake](https://github.com/bpampuch/pdfmake) open-source library.
</DESCRIPTION>

<USAGE>
```
(params: {
  docDefinition: object,
  tableLayouts?: object,
  filename: string,
  fonts?: object,
}): void
```

###### object
  - `docDefinition: object`: __Required__ - The document definition object which includes styling, columns, tables etc.
  - `tableLayouts: object`: The table layouts for the generated PDF file.
  - `filename: string`: __Required__ - The name for the generated PDF file.
  - `fonts: object`: The fonts for the generated PDF file.
###### See the [pdfMake docs](https://pdfmake.github.io/docs) for more info on these properties.
</USAGE>

<EXAMPLES>
###### Generate a PDF (simple example):
```yaml
- id: generate_pdf_button
  type: Button
  properties:
    title: Download PDF
    icon: AiOutlineDownload
  events:
    onClick:
      - id: make_pdf
        type: PdfMake
        params:
          filename:
            my_file_name.pdf
          docDefinition:
            pageMargins: 50
            defaultStyle:
              fontSize: 10
            content:
              - text: This pdf has been generated with Lowdefy and pdfMake.
                bold: true
```

###### Generate a PDF (detailed example):
```yaml
- id: pdf_generate_button
  type: Button
  style:
    textAlign: center
  properties:
    title: Generate & Download PDF
    icon: AiOutlineDownload
    color: '#6293F8'
  events:
    onMount:
      - id: init_data
        type: SetState
        params:
          invoice:
            id: '0030135'
            account_id: 'A-11344'
            inv_date:
              _date: now
            subtotal: 397.034
            discount: -19.8517
            vat: 59.5551
            total: 436.7374
            balance: 413.2330
            customer:
              name: Service Center
              phone: +123-456-7890
              vat_nmr: 12-333-4567
              address: |
                123 Main St.
                Anytown
                CA
                US
                9999
            services:
              - name: Hosting and Maintannce
                qty: 1
                price: 235.90
                code: X12-33C
              - name: Developer Hours
                qty: 16
                price: 60.345
                code: X12-39A
              - name: Designer Hours
                qty: 4
                price: 40.122
                code: X12-21A
              - name: Project Management
                qty: 2
                price: 60.667
                code: X12-49A
    onClick:
      - id: generate_pdf
        type: PdfMake
        params:
          _ref: inv_template.yaml
```

###### `/inv_template.yaml`
```yaml
filename:
  _nunjucks:
    on:
      _state: invoice
    template: 'INV-{{ id }}-{{ inv_date | date("DD-MM-YYYY") }}.pdf'
docDefinition:
  pageMargins: [50, 25, 50, 70]
  defaultStyle:
    fontSize: 10
  footer:
    _function:
      - columns:
          - qr:
              _string.concat:
                - _location: origin
                - /invoice?id="
                - _state: invoice.id
                - '"'
            margin: [50, 0, 0, 0]
            fit: '64'
          - alignment: 'right'
            fontSize: 7
            margin: [0, 0, 50, 0]
            text:
              __nunjucks:
                template: 'Page {{ page }} of {{ total }}'
                on:
                  page:
                    __args: 0
                  total:
                    __args: 1
  content:
    - columns:
        - width: 'auto'
          margin: [0, 20, 0, 0]
          stack:
            - fontSize: 9
              text: |

            - fontSize: 7
              text: |
                Example Services Ltd.
                112 Street Name
                City, State 12345
                Country
                001-AB

                +00-1234-5566
                info@example.com

                Vat Number: 444 5555 0000

        - width: '*'
          text: ' '
        - width: 110
          stack:
            - margin: [0, 5, 0, 0]
              alignment: right
              fontSize: 7
              text: |
                Example Services Ltd.
                Reg Number: 2001/22224/09

    - margin: [0, 20, 0, 20]
      text: Customer Invoice
      bold: true
      alignment: center
      fontSize: 14
    - columns:
        - width: 150
          bold: true
          text: |
            INVOICE NUMBER:
            DATE ISSUED:
            ACCOUNT NUMBER:
        - width: '*'
          text:
            _nunjucks:
              template: |
                {{ id }}
                {{ inv_date | date("YYYY/MM/DD") }}
                {{ account_id }}
              on:
                _state: invoice
        - width: 150
          bold: true
          text: |
            CUSTOMER:
            ADDRESS:
        - width: '*'
          text:
            _nunjucks:
              template: |
                {{ customer.name }}
                {{ customer.address }}
              on:
                _state: invoice

    - layout: 'lightHorizontalLines'
      margin: [0, 10, 0, 0]
      table:
        widths: [70, '*', 70, 70, 70]
        headerRows: 1
        body:
          _json.parse:
            _nunjucks:
              on:
                services:
                  _state: invoice.services
              template: |
                [
                  [
                    { "text": "ITEM CODE", "bold": true },
                    { "text": "SERVICE", "bold": true },
                    { "text": "UNIT PRICE", "bold": true, "alignment": "right"  },
                    { "text": "QTY", "bold": true, "alignment": "right"  },
                    { "text": "COST", "bold": true, "alignment": "right" }
                  ],
                  {% for item in services %}
                  [
                    "{{ loop.index }}: {{ item.code }}",
                    "{{ item.name | safe }}",
                    { "text": "{{ ( item.price / item.qty ).toFixed(2) }}", "alignment": "right"},
                    { "text": "{{ item.qty }}", "alignment": "right"},
                    { "text": "{{ item.price.toFixed(2) }}", "alignment": "right"}
                    {% if loop.last %} ] {% else %} ], {% endif %}
                  {% endfor %}
                ]
    - layout: 'headerLineOnly'
      margin: [0, -5, 0, 0]
      table:
        widths: ['*', 70, 70, 70]
        headerRows: 1
        body:
          - - ''
            - ''
            - ''
            - ''
          - - ''
            - alignment: right
              text: 'Subtotal:'
            - ''
            - alignment: right
              text:
                _number.toFixed:
                  - _state: invoice.subtotal
                  - 2
          - - ''
            - alignment: right
              text: 'Discount (5%):'
            - ''
            - alignment: right
              text:
                _number.toFixed:
                  - _state: invoice.discount
                  - 2
          - - ''
            - alignment: right
              text: 'VAT (15%):'
            - ''
            - alignment: right
              text:
                _number.toFixed:
                  - _state: invoice.vat
                  - 2
          - - ''
            - alignment: right
              text: 'Total:'
            - ''
            - alignment: right
              text:
                _number.toFixed:
                  - _state: invoice.total
                  - 2
    - layout: 'headerLineOnly'
      margin: [0, -5, 0, 0]
      table:
        widths: ['*', 70, 70, 70]
        headerRows: 1
        body:
          - - ''
            - ''
            - ''
            - ''
          - - ''
            - alignment: right
              bold: true
              text: 'BALANCE DUE:'
            - ''
            - alignment: right
              bold: true
              text:
                _number.toFixed:
                  - _state: invoice.balance
                  - 2
```
</EXAMPLES>
