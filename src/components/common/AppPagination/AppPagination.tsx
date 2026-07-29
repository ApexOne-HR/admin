import {
  Box,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

type AppPaginationProps = {
  page: number;
  lastPage: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
};

export function AppPagination({
  page,
  lastPage,
  onPageChange,
  onPerPageChange,
  perPage,
  perPageOptions = [10, 15, 25, 50],
  total,
}: AppPaginationProps) {
  const firstResult = total === 0 ? 0 : (page - 1) * perPage + 1;
  const lastResult = Math.min(page * perPage, total);

  return (
    <Box
      sx={{
        alignItems: 'center',
        borderTop: 1,
        borderColor: 'divider',
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' },
        minHeight: 64,
        px: 2,
        py: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        Showing {firstResult} to {lastResult} of {total} results
      </Typography>

      <Pagination
        page={page}
        count={Math.max(lastPage, 1)}
        onChange={(_event, nextPage) => onPageChange(nextPage)}
        boundaryCount={1}
        siblingCount={1}
        showFirstButton
        showLastButton
        shape="rounded"
        size="small"
        variant="outlined"
        color="primary"
        sx={{
          justifySelf: { xs: 'start', md: 'center' },
          '& .MuiPaginationItem-root': {
            borderColor: 'transparent',
          },
          '& .Mui-selected': {
            borderColor: 'primary.main',
            bgcolor: 'transparent !important',
          },
        }}
      />

      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifySelf: { xs: 'start', md: 'end' } }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Rows per page:
        </Typography>
        <TextField
          select
          size="small"
          value={perPage}
          onChange={(event) => onPerPageChange(Number(event.target.value))}
          slotProps={{ htmlInput: { 'aria-label': 'Rows per page' } }}
          sx={{
            width: 72,
            '& .MuiInputBase-root': { height: 36 },
          }}
        >
          {perPageOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </Box>
  );
}
