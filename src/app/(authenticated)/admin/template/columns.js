import { createColumnHelper } from '@tanstack/react-table';

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor('notiTitle', {
    header: 'タイトル',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('notiBody', {
    header: '本文',
    cell: (info) => info.getValue(),
  }),
]
