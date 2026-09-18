import { type ReactNode, useId, useState } from 'react';
import { Table2 } from 'lucide-react';
import { Card } from './Card';

export interface ChartTable {
  columns: string[];
  rows: (string | number)[][];
}

export interface ChartFrameProps {
  title: string;
  /** One sentence a screen reader can use instead of the marks. */
  summary: string;
  /** Rendered under the title, for the reader who can see the chart. */
  caption?: string;
  /** The same numbers in text, for anyone the colours fail. */
  table: ChartTable;
  children: ReactNode;
}

/**
 * Every chart in the app is wrapped in this: a title, a textual summary on the
 * plot itself, and a data table one tap away. Colour is never the only channel.
 */
export function ChartFrame({ title, summary, caption, table, children }: ChartFrameProps) {
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="kpi-label">{title}</h3>
          {caption && <p className="mt-1 text-sm text-white/45">{caption}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((value) => !value)}
          aria-expanded={showTable}
          aria-controls={tableId}
          className="inline-flex items-center gap-1.5 shrink-0 rounded-full border border-white/[0.06] px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-white/45 hover:text-white hover:border-white/[0.06] transition-colors"
        >
          <Table2 size={12} aria-hidden="true" />
          {showTable ? 'Grafico' : 'Dati'}
        </button>
      </div>

      {showTable ? (
        <div id={tableId} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {table.columns.map((column, index) => (
                  <th
                    key={column}
                    scope="col"
                    className={`py-2 kpi-label ${index === 0 ? 'text-left' : 'text-right'}`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={String(row[0])} className="border-b border-white/[0.06] last:border-0">
                  {row.map((cell, index) => (
                    <td
                      key={index}
                      className={`py-2 ${
                        index === 0 ? 'text-white' : 'text-right tabular-nums text-white/45'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div role="img" aria-label={`${title}. ${summary}`}>
          {children}
        </div>
      )}
    </Card>
  );
}
