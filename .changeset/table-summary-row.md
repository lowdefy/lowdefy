---
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-table': minor
---

feat(blocks-table): Show a total row from data in the Table summary footer

`summaryRow` takes one row object, such as a report total computed by the request, and the summary footer shows it in place of the aggregates. Each column renders it as it renders a body row, with its type, cell options and rules. Use it for totals the table can not compute from its rows, such as a rate whose total is not the sum or average of the rows' rates.

The row is not a data row: sorting, filtering, search, selection and the record count leave it out, it stays in view under `height`, and `exportCsv` adds it as the last line. Group headers keep their aggregates. `TableLight` refuses `summaryRow` with a message naming `Table`.
