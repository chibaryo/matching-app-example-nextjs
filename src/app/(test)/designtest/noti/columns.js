import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs'

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor('notificationId', {
    header: 'notificationId',
    cell: (info) => info.getValue(),
    meta: { isVisible: false },
  }),
  columnHelper.accessor('notiTitle', {
    header: 'タイトル',
    cell: (info) => //info.getValue(),
    {
      const { row } = info;  // Access the entire row
      const createdAt = row.original.createdAt;  // Get the createdAt field
      const formattedDate = dayjs.unix(createdAt.seconds).format("YYYY/MM/DD hh:mm")
//      const formattedDate = dayjs(createdAt).format('MM/DD');  // Format the date
//      console.log("formattedDate: ", formattedDate)
      return `[${formattedDate}] ${info.getValue()}`;  // Concatenate and return
    },
  }),
  columnHelper.accessor('notiBody', {
    header: '本文',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('notiTopic', {
    header: '対象トピック',
    cell: (info) => info.getValue(),
    meta: {
        filterVariant: "select_topic"
      }
    }),
/*  columnHelper.accessor('officeLocation', {
    header: '支店',
    cell: (info) => info.getValue(),
    meta: {
      filterVariant: "select_loc"
    }
  }),
  columnHelper.accessor('department', {
    header: '部署',
    cell: (info) => info.getValue(),
    meta: {
      filterVariant: "select_dep"
    }
  }), */
]
