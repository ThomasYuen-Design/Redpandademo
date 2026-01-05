import React from 'react';
import { cn } from './Badge';

interface BaseRecord {
  id: string | number;
  [key: string]: any;
}

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends BaseRecord> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends BaseRecord>({ 
  data, 
  columns, 
  className,
  onRowClick
}: DataTableProps<T>) {
  return (
    <div className={cn("rounded-lg border border-slate-200 overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-200">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={cn("px-6 py-3 whitespace-nowrap", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                  No results found
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr 
                  key={row.id} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "hover:bg-slate-50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col, i) => (
                    <td key={i} className={cn("px-6 py-4", col.className)}>
                      {col.cell 
                        ? col.cell(row) 
                        : (col.accessorKey ? row[col.accessorKey] : null)
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
