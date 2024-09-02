import { createColumnHelper } from '@tanstack/react-table';
import {
  Tag
} from '@chakra-ui/react'
import { format, isValid, toDate } from 'date-fns';

const columnHelper = createColumnHelper();

const getColorScheme = (index) => {
  switch (index) {
    case 0:
      return 'blue';  // Primary department
    case 1:
      return 'red';  // Secondary department
    case 2:
      return 'green'; // Third department
    default:
      return 'gray';  // Default color for more than three departments
  }
};

export const columns = [
  columnHelper.accessor('uid', {
    header: 'UID',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('name', {
    header: 'ユーザ名',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('email', {
    header: 'アドレス',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('officeLocation', {
    header: '支店',
    cell: (info) => info.getValue(),
    meta: {
      filterVariant: "select_loc"
    }
  }),
  columnHelper.accessor('department', {
    header: '部署',
//    cell: (info) => info.getValue().join(', '), // Join array elements for display
    cell: (info) => {
  const departments = info.getValue(); // assuming departments is an array

  // Ensure departments is an array
  const departmentArray = Array.isArray(departments) ? departments : [departments];

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {departmentArray.map((dep, index) => (
        <Tag key={index} colorScheme={getColorScheme(index)}>
          {dep}
        </Tag>
      ))}
    </div>
  );
    },
    filterFn: 'includes',
    meta: {
      filterVariant: "select_dep" // Updated filter variant
    }
  }),
  columnHelper.accessor('jobLevel', {
    header: '役職',
    cell: (info) => info.getValue(),
    meta: {
      filterVariant: "select_jobLevel"
    }
  }),
/*  columnHelper.accessor('createdAt', {
    header: '作成日',
    cell: (info) => {
      const date = info.getValue() // new Date(info.getValue());
      const createdDate = date.toDate()
      
      // Check if the date is valid
      if (isValid(createdDate)) {
        console.log("isValid Time !!!")
        return format(createdDate, 'yyyy-MM-dd HH:mm:ss');
      } else {
        console.log("is NOt Valid Time !!!", createdDate)
        return 'Invalid Date';  // Fallback for invalid dates
      }
    },
    sortType: 'datetime',
    sortingFn: 'datetime',  // Built-in datetime sorting
  }),  */
]

/*
export const columns = [
  columnHelper.accessor('name', {
    header: 'ユーザ名',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('uid', {
    header: 'UID',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('email', {
    header: 'アドレス',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('department', {
    header: '部署',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('jobLevel', {
    header: '役職',
    cell: info => info.getValue(),
  }),
/*  columnHelper.accessor('userType', {
    header: 'User Type',
    cell: info => info.getValue() === 'admin' ? '管理者' : '一般ユーザ',
  }),
]; */
