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



const validateUser = (user) => {
  const errors = [];

  if (
    !user.name ||
    typeof user.name !== 'string' ||
    /^\d+$/.test(user.name.trim())
  ) {
    errors.push('Invalid or missing name');
  }

  if (
    !user.email ||
    typeof user.email !== 'string' ||
    !user.email.includes('@')
  ) {
    errors.push('Invalid or missing email');
  }



  if (!user.address?.city || typeof user.address.city !== 'string') {
    errors.push('Missing or invalid city in address');
  }

 
  if (!user.company?.name || typeof user.company.name !== 'string') {
    errors.push('Missing or invalid company name');
  }

  return errors;
};



const TableCell = React.memo(({ cell }) => (
  <td className={styles.cell}>
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </td>
));

const TableRow = React.memo(({ row, index, style, errors = [] }) => (
  <>
    <tr
      className={`${styles.row} ${index % 2 === 0 ? styles.evenRow : ''}`}
      style={style}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} cell={cell} />
      ))}
    </tr>
    {errors.length > 0 && (
      <tr
        className={styles.errorRow}
        style={{
          ...style,
          backgroundColor: '#ffe6e6',
          display: 'table',
          width: '100%',
        }}
      >
        <td colSpan={row.getVisibleCells().length} className={styles.errorCell}>
          {errors.map((err, i) => (
            <div key={i} className={styles.errorText}>⚠️ {err}</div>
          ))}
        </td>
      </tr>
    )}
  </>
));

const UserList = () => {
  const { users, loadMore, hasMore, loading, error } = usepage();
  const parentRef = useRef();

  const columns = useMemo(() => [
    {
      header: 'Name',
      accessorFn: (row) => row.name ?? 'N/A',
      id: 'name',
    },
    {
      header: 'Email',
      accessorFn: (row) => row.email ?? 'N/A',
      id: 'email',
    },
    {
      header: 'Phone',
      accessorFn: (row) => row.phone ? formatPhone(row.phone) : 'N/A',
      id: 'phone',
    },
    {
      header: 'Company (City)',
      accessorFn: (row) => {
        const companyName = row.company?.name ?? 'Unknown Company';
        const city = row.address?.city ?? 'Unknown City';
        return `${companyName} (${city})`;
      },
      id: 'companyCity',
    },
  ], []);

  const validationErrorsMap = useMemo(() => {
    const errorMap = {};
    users.forEach((user, index) => {
      const errors = validateUser(user);
      if (errors.length > 0) {
        errorMap[index] = errors;
      }
    });
    return errorMap;
  }, [users]);

  useEffect(() => {
    users.forEach((user, index) => {
      const validationErrors = validateUser(user);
      if (validationErrors.length > 0) {
        console.warn(`User at index ${index} has validation issues:`, validationErrors, user);
      }
    });
  }, [users]);

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
                errors={validationErrorsMap[virtualRow.index] || []}
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
