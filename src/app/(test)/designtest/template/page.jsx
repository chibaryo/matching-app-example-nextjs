'use client'

import React, { useRef, useEffect, useState, useContext, useMemo } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// ChakraUI
import {
  Box,
  HStack,
  Button,
  ButtonGroup,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  // Modal
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  //
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  IconButton
} from '@chakra-ui/react'

// TanStack
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender } from '@tanstack/react-table';
import { columns } from './columns';

// Server Actions
import { updateFirestoreWithId, postToFirestoreWithId, deletePostById, removePostsById, readFromFirestore, postToFirestore } from '@/action/google/firestore'

// Components
import bgColorList from '@/assets/data/colorlist.json'
import DeleteTagModalPopup from '@/components/common/DeleteTagModalPopup'
import { useThemeContext } from "@/context/ThemeContext";
import PaginationManipButtons from '@/components/common/PaginationManipButtons'
import { db } from '@/utils/firebase/firebaseinit'
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";

const TemplateAdmin = () => {
  const running = useRef(true)
  const currentRowId = useRef(null)

  const initialPage = useRef(1)
  const currentPage = useRef(null)
  const totalPage = useRef(null)
  const [ isNotificationEnabled, setIsNotificationEnabled ] = useState(false)
  const [ tableContents, setTableContents ] = useState([])
  const step = 5

  const [ notiTemplates, setNotiTemplates ] = useState([])
  const [ isPopOpen, setIsPopOpen ] = useState(false)
  const [ notiTitle, setNotiTitle ] = useState('')
  const [ notiBody, setNotiBody ] = useState('')

  const [ showModal, setShowModal ] = useState(false)
  const [ delDialogTitle, setDelDialogTitle ] = useState('テンプレート削除')
  const [ delDialogBody, setDelDialogBody ] = useState('テンプレート削除')
  const [ modalButtonText, setModalButtonText ] = useState("テンプレート登録")
  const [ modalHeadingText, setModalHeadingText ] = useState("テンプレート追加")

  const [columnFilters, setColumnFilters] = useState([])

  const { bgColor, theme } = useThemeContext()

  const mainSidebarColor = bgColorList[theme.name].color[bgColor].main
  const textSidebarColor = bgColorList[theme.name].color[bgColor].text
  const profileSidebarColor = bgColorList[theme.name].color[bgColor].profile
  const notifySidebarColor = bgColorList[theme.name].color[bgColor].notify

  //
  const [ isShowPasswd, setIsShowPasswd ] = useState(false)
  const handlePwdShow = () => {
    setIsShowPasswd(!isShowPasswd)
  }

  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    (async () => {
      if(process.env.NODE_ENV == 'development')
      {
        if (running.current) {
          running.current = false
          return
        }
      }

      // set paginated table data
      currentPage.current = 1

      const resp = await readFromFirestore("templates")
      console.log("templates", JSON.parse(resp.posts))
      setNotiTemplates(JSON.parse(resp.posts))
//      setTags((preData) => {
//        const total = (preData.length % step == 0) ? (preData.length / step) : (Math.floor(preData.length / step) + 1)
//        totalPage.current = total
        // Show page 1 contents
//        setPaginatedTableContents(currentPage.current, step)
//      })

    })()
  }, [])

  // TanStack Table
  const table = useReactTable({
    data: notiTemplates,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
     },
     onColumnFiltersChange: setColumnFilters,
  });

  const handleFilterChange = (id, value) => {
    setFilters(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const Bfunction = (() => {
    table.getHeaderGroups()[0].headers[2].column.setFilterValue("admin");
  })

  const handleDepChange = (selectedOptions) => {
    console.log("selectedOptions: (dep)", selectedOptions)
    setDepChoices(selectedOptions);
  };

  // End TanStack

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (currentRowId.current == -1) {
      // Add new record
      console.log("-1? ")
      console.log(currentRowId.current)
      try {
        const docRef = doc(collection(db, "templates"))
        await setDoc(docRef, {notiTitle: notiTitle, notiBody: notiBody, notiTemplateId: docRef.id, createdAt: serverTimestamp() })
        setNotiTemplates([...notiTemplates, { notiTitle: notiTitle, notiBody: notiBody, notiTemplateId: docRef.id}])
      } catch (err) {
        console.error (err)
      }
/*      const resp = await postToFirestoreWithId('notitemplates', {
        notiTitle: notiTitle,
        notiBody: notiBody,
      }) */
      // Add new array to tags
    } else if (typeof(currentRowId.current) === "string" || currentRowId.current instanceof String) {
      // Update existing record
      console.log(" >= 0 ? ")
      console.log(currentRowId.current)

      const resp = await updateFirestoreWithId('templates', {
        notiTitle: notiTitle,
        notiBody: notiBody,
      }, currentRowId.current)

      // Renew tags array
      const r_Index = notiTemplates.findIndex((u) => u.docId == currentRowId.current)
      setNotiTemplates(notiTemplates.map((u, idx) => (idx == r_Index ? {notiTitle: notiTitle, notiBody: notiBody} : u))) // , notiTemplateId: currentRowId.current
    }

    setNotiTitle('')
    setNotiBody('')

    // Close modal
    setShowModal(false)
  }
 
  const handleEditRow = async (el, idx) => {
    const { docId, notiTemplateId, notiTitle, notiBody } = el.original;
    currentRowId.current = docId
    setNotiTitle(notiTitle)
    setNotiBody(notiBody)
    setModalButtonText("テンプレート更新")
    setModalHeadingText("テンプレート更新")
    setShowModal(true)
  }

  const handleDelRow = async (el, idx) => {
    const { notiTemplateId, notiTitle, notiBody } = el.original;
    currentRowId.current = notiTemplateId
    console.log("el: ", currentRowId.current)
    setDelDialogTitle("テンプレート削除")
    setDelDialogBody(`このテンプレートを削除しますか？ : ${notiTitle}`)
    setIsPopOpen(true)
  }

  const doDelRow = async (id) => {
    console.log("delete uid", id)
    try {
      await deletePostById("templates", id)
      const r_index = notiTemplates.findIndex((u) => u.notiTemplateId == id)
      // delete row
      console.log("r_index", r_index)
      setNotiTemplates(
        notiTemplates.filter((n, idx) => n.notiTemplateId !== id)
      )
    } catch (err) {
      console.error (err)
    }

    // Then remove "tagtidy" collection: if el.id == tagId

    setIsPopOpen(false)
  }

  const cancelDelRow = async (e) => {
    setIsPopOpen(false)
  }

  const openModal = () => {
    // Add new record
    currentRowId.current = -1
    // Clear form
    setNotiTitle('')
    setNotiBody('')
    setModalHeadingText("テンプレート追加")
    setModalButtonText("テンプレート登録")
    setShowModal(true)
  }

  const closeModal = (e) => {
    setShowModal(false)
  }

  return (
    <>
      {/* Modal test button */}
      <Button colorScheme='red' onClick={onOpen}>Show Modal</Button>
      {/* New User button */}
      <button
        type="button"
        className='text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:bg-gradient-to-br focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800 font-medium rounded-lg text-md px-5 py-2.5 text-center mx-2 my-2'
        onClick={() => openModal()}>
        テンプレート登録
      </button>

      {/* Chakra Modal */}
      <Modal isOpen={isOpen} onClose={onClose} >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>テンプレート追加</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
          <Stack spacing={4}>
            <Input variant="outline" type="text" placeholder="テンプレタイトル" size="md" />
            <Input variant="outline" type="text" placeholder="テンプレ本文" size="md" />
            <InputGroup size="md">
                <Input variant="outline" type={isShowPasswd ? "text" : "password"} placeholder="パスワード" size="md" />
                <InputRightElement>
                <IconButton
                  size="sm"
                  onClick={handlePwdShow}
                  icon={isShowPasswd ? <FaEyeSlash /> : <FaEye />}
                  aria-label={isShowPasswd ? "Hide password" : "Show password"}
                />
                </InputRightElement>
            </InputGroup>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant='ghost'>Secondary Action</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Begin Modal */}
      <div
        id="default-modal"
        hidden={!showModal}
        tabIndex="-1"
        aria-hidden="true"
        className="animate-slide-in-top opacity-0.3 overflow-y-auto overflow-x-hidden w-full z-50 fixed top-24"
      >
        <div className="relative p-4 max-w-2xl max-h-full">
          {/* <!-- Modal content --> */}
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            {/* <!-- Modal header --> */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {modalHeadingText}
              </h3>
              <button type="button" onClick={(e) => closeModal(e)} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="default-modal">
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            {/* <!-- Modal body --> */}
            <div className="p-4 md:p-5">
              <form className="space-y-4" onSubmit={(e) => handleSubmit(e)}>
                <div>
                  <label htmlFor="notiTitle" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">タイトル</label>
                  <input
                    type="text"
                    name="notiTitle"
                    placeholder="タイトル"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={notiTitle}
                    onChange={(e) => setNotiTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="notiBody" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">本文</label>
                  <input
                    type="text"
                    name="notiBody"
                    placeholder="本文"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={notiBody}
                    onChange={(e) => setNotiBody(e.target.value)}
                    required
                  />
                </div>
                {/* register button */}
                <button
                  type="submit"
                  className="w-full text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  style={theme.name == "dark" ? { backgroundColor: mainSidebarColor, color: textSidebarColor } : { backgroundColor: textSidebarColor, color: mainSidebarColor }}
                >
                  {modalButtonText}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* End modal */}

      {/* ChakraUI Table */}
      <TableContainer>
      <Table variant='striped' colorScheme='teal'>
        <Thead>
        {table.getHeaderGroups().map(headerGroup => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <><Th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <>
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none'
                              : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted()] ?? null}
                        </div>
                        {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} />
                          </div>
                        ) : null}
                      </>
                    )}
                  </Th>
                  </>
                )
              })}
              <Th colSpan="2">Action</Th>
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {table.getRowModel().rows.map((row, idx) => {
            return (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <Td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Td>
                  )
                })}
                <Td>
                  <HStack spacing={4}>
                    <Button colorScheme='blue' onClick={() => handleEditRow(row, idx)}>Edit</Button>
                    <Button colorScheme='red' onClick={() => handleDelRow(row, idx)}>Delete</Button>
                  </HStack>
                </Td>
              </Tr>
            )
          })}
        </Tbody>
      </Table>
    </TableContainer>


{/*
    <PaginationManipButtons
      gotoFirstPage={gotoFirstPage}
      gotoPrevPage={gotoPrevPage}
      gotoNextPage={gotoNextPage}
      gotoLastPage={gotoLastPage}
    />
 */}
    <div hidden={!isPopOpen} className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  {/* <!--
    Background backdrop, show/hide based on modal state.

    Entering: "ease-out duration-300"
      From: "opacity-0"
      To: "opacity-100"
    Leaving: "ease-in duration-200"
      From: "opacity-100"
      To: "opacity-0"
  --> */}
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

  <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      {/* <!--
        Modal panel, show/hide based on modal state.

        Entering: "ease-out duration-300"
          From: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          To: "opacity-100 translate-y-0 sm:scale-100"
        Leaving: "ease-in duration-200"
          From: "opacity-100 translate-y-0 sm:scale-100"
          To: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      --> */}
      <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">{delDialogTitle}</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{delDialogBody}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            onClick={() => doDelRow(currentRowId.current)}
            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto">削除</button>
          <button
            type="button"
            onClick={(e) => cancelDelRow(e)}
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">キャンセル</button>
        </div>
      </div>
    </div>
  </div>
</div>

    </>
  )
}

function Filter({ column }) {
  const columnFilterValue = column.getFilterValue()
  const { filterVariant } = column.columnDef.meta ?? {}

  return filterVariant === 'range' ? (
    <div>
      <div className="flex space-x-2">
        {/* See faceted column filters example for min max values functionality */}
        <DebouncedInput
          type="number"
          value={(columnFilterValue)?.[0] ?? ''}
          onChange={value =>
            column.setFilterValue((old) => [value, old?.[1]])
          }
          placeholder={`Min`}
          className="w-24 border shadow rounded"
        />
        <DebouncedInput
          type="number"
          value={(columnFilterValue)?.[1] ?? ''}
          onChange={value =>
            column.setFilterValue((old) => [old?.[0], value])
          }
          placeholder={`Max`}
          className="w-24 border shadow rounded"
        />
      </div>
      <div className="h-1" />
    </div>
  ) : filterVariant === 'select_dep' ? (
    <select
      onChange={e => column.setFilterValue(e.target.value)}
      value={columnFilterValue?.toString()}
    >
      {/* See faceted column filters example for dynamic select options */}
      <option value="">All</option>
      <option value="総務部">総務部</option>
      <option value="営業部">営業部</option>
    </select>
  ) : filterVariant === 'select_loc' ? (
    <select
      onChange={e => column.setFilterValue(e.target.value)}
      value={columnFilterValue?.toString()}
    >
      {/* See faceted column filters example for dynamic select options */}
      <option value="">All</option>
      <option value="東京">東京</option>
      <option value="大阪">大阪</option>
      <option value="名古屋">名古屋</option>
    </select>
  ) : (
    <DebouncedInput
      className="w-36 border shadow rounded"
      onChange={value => column.setFilterValue(value)}
      placeholder={`Search...`}
      type="text"
      value={(columnFilterValue ?? '')}
    />
    // See faceted column filters example for datalist search suggestions
  )
}

// A typical debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}/*: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> */) {
  const [value, setValue] = React.useState(initialValue)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return (
    <input {...props} value={value} onChange={e => setValue(e.target.value)} />
  )
}


export default TemplateAdmin