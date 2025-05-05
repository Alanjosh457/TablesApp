import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usepage } from '../hooks/usepage';
import styles from '../UserList.module.css';

const formatPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return phone;
};

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const TableCell = React.memo(({ cell }) => (
  <td className={styles.cell}>
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </td>
));

const TableRow = React.memo(({ row, index, style }) => (
  <tr
    className={`${styles.row} ${index % 2 === 0 ? styles.evenRow : ''}`}
    style={style}
  >
    {row.getVisibleCells().map((cell) => (
      <TableCell key={cell.id} cell={cell} />
    ))}
  </tr>
));

const UserList = () => {
  const { users, loadMore, hasMore, loading, error } = usepage();
  const parentRef = useRef();

  const columns = useMemo(() => [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    {
      header: 'Phone',
      accessorFn: (row) => formatPhone(row.phone),
      id: 'phone',
    },
    {
      header: 'Company (City)',
      accessorFn: (row) => `${row.company?.name ?? ''} (${row.address?.city ?? ''})`,
      id: 'companyCity',
    },
  ], []);

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  const handleScroll = useCallback(
    debounce(() => {
      const el = parentRef.current;
      if (!el) return;
      const scrollBottom = el.scrollTop + el.clientHeight;
      if (scrollBottom >= el.scrollHeight - 200 && hasMore && !loading) {
        loadMore();
      }
    }, 200),
    [hasMore, loading, loadMore]
  );

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div ref={parentRef} className={styles.tableContainer}>
      <table className={styles.table}>
        <thead className={styles.headerRow} style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className={styles.headerCell}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody
          style={{
            display: 'block',
            height: `${totalHeight}px`,
            position: 'relative',
          }}
        >
          {virtualRows.map((virtualRow) => {
            const row = table.getRowModel().rows[virtualRow.index];
            return (
              <TableRow
                key={row.id}
                row={row}
                index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'table',
                  width: '100%',
                  tableLayout: 'fixed',
                }}
              />
            );
          })}
        </tbody>
      </table>

      {loading && <p style={{ textAlign: 'center' }}>Loading...</p>}
      {error && <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>}
    </div>
  );
};

export default UserList;
