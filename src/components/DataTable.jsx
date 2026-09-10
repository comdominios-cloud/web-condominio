import { AsyncSection } from './States.jsx';

export default function DataTable({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyText,
}) {
  return (
    <AsyncSection
      loading={loading}
      error={error}
      isEmpty={!rows || rows.length === 0}
      onRetry={onRetry}
      emptyTitle={emptyTitle}
      emptyText={emptyText}
    >
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} style={column.align ? { textAlign: column.align } : undefined}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={rowKey ? rowKey(row, index) : index}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.className}
                    style={column.align ? { textAlign: column.align } : undefined}
                  >
                    {column.render(row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AsyncSection>
  );
}
