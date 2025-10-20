import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  hoverable?: boolean;
  className?: string;
  variant?: 'default' | 'striped' | 'bordered';
}

function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
  hoverable = true,
  className = '',
  variant = 'default',
}: TableProps<T>) {
  const variantClasses = {
    default: 'pro-table',
    striped: 'pro-table [&_tbody_tr:nth-child(even)]:bg-muted/50',
    bordered: 'pro-table border border-border',
  };

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 bg-white ${className}`}>
      <table className={`min-w-full ${variantClasses[variant]}`}>
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-16 text-center text-gray-500 font-medium"
              >
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {emptyMessage}
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`
                  ${hoverable ? 'hover:bg-gray-50' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                  transition-colors duration-150
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium"
                  >
                    {column.render
                      ? column.render(row[column.key] as T[keyof T], row)
                      : (row[column.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
