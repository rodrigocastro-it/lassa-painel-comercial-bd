function displayValue(value) {
  return value === '' || value === null || value === undefined ? '—' : value;
}

export default function Table({ columns, rows, totalsRow, rowKey, dense }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="bg-page text-left text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`whitespace-nowrap px-3 ${dense ? 'py-2' : 'py-2.5'} ${col.align === 'right' ? 'text-right' : 'text-left'}`}
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
              className="border-t border-hairline odd:bg-surface even:bg-page-alt hover:bg-lassa-blue-50"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`whitespace-nowrap px-3 ${dense ? 'py-1.5' : 'py-2'} ${col.align === 'right' ? 'text-right tabular' : 'text-left'}`}
                >
                  {col.format ? col.format(row[col.key], row) : displayValue(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totalsRow && (
          <tfoot>
            <tr className="border-t-2 border-lassa-blue-600 bg-lassa-blue-50 font-semibold text-ink-primary">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`whitespace-nowrap px-3 py-2.5 ${col.align === 'right' ? 'text-right tabular' : 'text-left'}`}
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
