function displayValue(value) {
  return value === '' || value === null || value === undefined ? '—' : value;
}

export default function Table({ columns, rows, totalsRow, rowKey, dense, onRowClick }) {
  return (
    <div className="overflow-x-auto rounded-md border border-hairline">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline bg-page-alt text-left text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`whitespace-nowrap px-3.5 ${dense ? 'py-2' : 'py-2.5'} ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={rowKey ? row[rowKey] : idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-t border-hairline transition-colors hover:bg-lassa-blue-tint ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`whitespace-nowrap px-3.5 ${dense ? 'py-1.5' : 'py-2.5'} ${col.align === 'right' ? 'text-right tabular' : 'text-left'}`}
                >
                  {col.format ? col.format(row[col.key], row) : displayValue(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totalsRow && (
          <tfoot>
            <tr className="border-t-2 border-lassa-blue-600 bg-lassa-blue-tint font-bold text-ink-primary">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`whitespace-nowrap px-3.5 py-2.5 ${col.align === 'right' ? 'text-right tabular' : 'text-left'}`}
                >
                  {col.format ? col.format(totalsRow[col.key], totalsRow) : totalsRow[col.key] ?? ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
