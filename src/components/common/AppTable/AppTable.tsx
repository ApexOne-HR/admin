import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { AppLoader } from '@/components/common/AppLoader';

export type AppTableColumn<T> = {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
};

export type AppTableProps<T> = {
  columns: AppTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  emptyState?: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
};

export function AppTable<T,>({
  columns,
  emptyState,
  getRowKey,
  isLoading = false,
  loadingLabel,
  rows,
}: AppTableProps<T>) {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <AppLoader label={loadingLabel ?? 'Loading table data...'} />
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent>
          {emptyState ?? (
            <Box className="py-8 text-center">
              <Typography color="text.secondary">No records found.</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  align={column.align}
                  key={column.key}
                  sx={{ fontWeight: 500, whiteSpace: 'nowrap', width: column.width }}
                >
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow hover key={getRowKey(row, index)}>
                {columns.map((column) => (
                  <TableCell align={column.align} key={column.key}>
                    {column.render(row, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
