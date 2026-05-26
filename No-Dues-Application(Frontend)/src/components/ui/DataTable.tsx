import { useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

interface DataTableProps<T> {
  rowData: T[];
  columnDefs: ColDef<T>[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  height?: string;
  onRowClick?: (row: T) => void;
  domLayout?: 'normal' | 'autoHeight';
  quickFilterText?: string;
}

export default function DataTable<T>({
  rowData,
  columnDefs,
  loading = false,
  pagination = true,
  pageSize = 15,
  height = '600px',
  onRowClick,
  domLayout = 'normal',
  quickFilterText,
}: DataTableProps<T>) {
  const gridRef = useRef<AgGridReact<T>>(null);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 100,
      flex: 1,
      tooltipValueGetter: onRowClick ? () => 'Click to update' : undefined,
    }),
    [onRowClick]
  );

  const onGridReady = useCallback((_params: GridReadyEvent) => {
    // Grid is ready
  }, []);

  const handleRowClick = useCallback(
    (event: { data: T | undefined }) => {
      if (onRowClick && event.data) {
        onRowClick(event.data);
      }
    },
    [onRowClick]
  );

  return (
    <div
      className="ag-theme-custom rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
      style={domLayout === 'normal' ? { height } : undefined}
    >
      <AgGridReact<T>
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination={pagination}
        paginationPageSize={pageSize}
        paginationPageSizeSelector={[10, 15, 25, 50, 100]}
        loading={loading}
        animateRows={true}
        rowSelection="single"
        onGridReady={onGridReady}
        onRowClicked={handleRowClick}
        domLayout={domLayout}
        quickFilterText={quickFilterText}
        suppressCellFocus={true}
        rowStyle={onRowClick ? { cursor: 'pointer' } : undefined}
      />
    </div>
  );
}
