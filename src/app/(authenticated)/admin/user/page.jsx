'use client'

import React, { useRef, useEffect, useState, useContext, useMemo } from "react";
import Select from 'react-select'

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
  Stack,
  Input,
  InputGroup,
  Text,
} from '@chakra-ui/react'

// TanStack
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender, getSortedRowModel } from '@tanstack/react-table';
import { columns } from './columns';

// Server Actions
import { getUserByUid, updateFirestoreWithId, postToFirestoreWithId, deletePostById, removePostsById, readFromFirestore, postToFirestore, deletePostsByUid } from '@/action/google/firestore'
import { updateFirebaseAuthUser, createFirebaseAuthUser, deleteFirebaseAuthUser } from '@/action/google/firebaseAdmin'
import { addUsersbyxlsx } from '@/action/user/addbyxlsx'

// Components
import bgColorList from '@/assets/data/colorlist.json'
import DeleteTagModalPopup from '@/components/common/DeleteTagModalPopup'
import { useThemeContext } from "@/context/ThemeContext";
import PaginationManipButtons from '@/components/common/PaginationManipButtons'
import { doc, collection, setDoc, serverTimestamp, onSnapshot, arrayUnion, updateDoc } from "firebase/firestore";
// Firestore
import { db, firebaseAuth } from '@/utils/firebase/firebaseinit'
// FirebaseAuth
import { onAuthStateChanged } from 'firebase/auth'

const selUserTypeOptions = [
  { value: 'general', label: '一般ユーザ' },
  { value: 'admin', label: '管理者' },
]

// department select
const department_options = [
  { value: 1, label: "総務部" },
  { value: 2, label: "営業部" },
]

const UserAdmin = () => {
  const running = useRef(true)
  const currentRowId = useRef(null)

  const initialPage = useRef(1)
  const currentPage = useRef(null)
  const totalPage = useRef(null)
  const [ isNotificationEnabled, setIsNotificationEnabled ] = useState(false)
  const [ tableContents, setTableContents ] = useState([])
  const step = 5

  const [ users, setUsers ] = useState([])
  const [ isPopOpen, setIsPopOpen ] = useState(false)
  const [ tagJapTitle, setTagJapTitle ] = useState('')
  const [ tagEngTitle, setTagEngTitle ] = useState('')
  const [ selGenre, setSelGenre ] = useState('')

  const [ showModal, setShowModal ] = useState(false)
  const [ delDialogTitle, setDelDialogTitle ] = useState('タグ削除')
  const [ delDialogBody, setDelDialogBody ] = useState('タグ削除')
  const [ modalButtonText, setModalButtonText ] = useState("タグ登録")
  const [ modalHeadingText, setModalHeadingText ] = useState("タグ追加")
  //
  const [ displayName, setDisplayName ] = useState("")
  const [ emailaddr, setEmailaddr ] = useState("")
  const [ password, setPassword ] = useState("")
  const [ department, setDepartment ] = useState("")
  const [ officeLocation, setOfficeLocation ] = useState("")
  const [ jobLevel, setJobLevel ] = useState("")
  const [ selectedUserType, setSelectedUserType ] = useState(selUserTypeOptions[0])

  // Excel
  const [ excelFile, setExcelFile ] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [ isSecondModalOpen, setIsSecondModalOpen ] = useState(false)

  const { bgColor, theme } = useThemeContext()

  const mainSidebarColor = bgColorList[theme.name].color[bgColor].main
  const textSidebarColor = bgColorList[theme.name].color[bgColor].text
  const profileSidebarColor = bgColorList[theme.name].color[bgColor].profile
  const notifySidebarColor = bgColorList[theme.name].color[bgColor].notify
  // User info
  const [ loginUser, setLoginUser ] = useState(null)
  // Excel registration result
  const [ registerExcel, setRegisterExcel ] = useState(null)

  // TanStack Table Filters
  const [filters, setFilters] = useState({
    department: '',
    jobLevel: ''
  });
  const [depChoices, setDepChoices] = useState([]);
  const [columnFilters, setColumnFilters] = useState([])
  const [sorting, setSorting] = useState([]);

  useEffect(() => {
    (async () => {
      if (process.env.NODE_ENV === 'development') {
        if (running.current) {
          running.current = false;
          return;
        }
      }
  
      const fbAuthUnsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          console.log('User Uid: ', user.uid);
          console.log('User email: ', user.email);
  
          // Get user info from Firestore
          const resUser = await getUserByUid(user.uid);
          console.log("user info: ", resUser);
  
          // Ensure resUser is a plain object
          if (resUser && typeof resUser === 'object') {
            setLoginUser({
              name: resUser.name,
              email: resUser.email,
              uid: resUser.uid,
              isAdmin: resUser.isAdmin,
              officeLocation: resUser.officeLocation,
              jobLevel: resUser.jobLevel,
              department: resUser.department,
            });
  
            // Create a reference to the users collection
            const usersCollectionRef = collection(db, 'users');
  
            const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
              let usersData = snapshot.docs.map(doc => ({
                docId: doc.id,
                ...doc.data(),
              }));
  
              // Filter usersData if the resUser is a "責任者"
              if (resUser.jobLevel === "責任者") {
                usersData = usersData.filter(user => {
                  // Check if any of the user's departments match with resUser.department
                  return resUser.department.some(dept => user.department.includes(dept));
                });
              }
  
              setUsers(usersData); // Update the state with new data
            });
  
            // Cleanup the listener on unmount
            return () => {
              unsubscribe();
              fbAuthUnsubscribe();
            };
          }
        } else {
          console.log("No user is signed in.");
        }
      });
    })();
  }, []);

  // TanStack Table
  const table = useReactTable({
    data: users,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters, //sorting
    },
    onColumnFiltersChange: setColumnFilters,
    filterFns: {
      includes: (row, columnId, filterValue) => {
        console.log('Filtering Function Triggered');
        console.log('Row:', row);
        console.log('Column ID:', columnId);
        console.log('Filter Value:', filterValue);
        if (!filterValue || !filterValue.length) return true;
        return filterValue.some(dep => {
          console.log('Department:', row.original[columnId]);
          return row.original[columnId].includes(dep);
        });
      }
    },
    globalFilterFn: 'includes',
//    onSortingChange: setSorting,
//    getSortedRowModel: getSortedRowModel(),
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

  //
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (currentRowId.current == -1) {
      // Add new record
      console.log("-1? ")
      console.log(currentRowId.current)
      // Create new FirebaseUser
      const resultUid = await createFirebaseAuthUser({
        displayName: displayName,
        email: emailaddr,
        password: password,
      })

      console.log("resultUid", resultUid)

      // Write to Firestore
      const docRef = doc(db, "users", resultUid)
      // check isAdmin
      console.log("selectedUserType: ", selectedUserType)
      const tmpSrvTime = serverTimestamp()

      try {
        await setDoc(docRef, {
          uid: resultUid,
          email: emailaddr,
          name: displayName,
          password: password,
          department: Array.isArray(department) ? department : [department], // Ensure it's an array
          officeLocation: officeLocation,
          jobLevel: jobLevel,
//          imagepath: "",
          isAdmin: selectedUserType.value == "admin" ? true : false,
//          isOnline: false,
          createdAt: tmpSrvTime,
          updatedAt: tmpSrvTime
        })
      } catch (err) {
        console.error (err)
      }
    } else if (typeof(currentRowId.current) === "string" || currentRowId.current instanceof String) {
      // Update existing record
      console.log(" >= 0 ? ")
      console.log(currentRowId.current)

      // Data
      console.log("displayName (name): ", displayName)
//      console.log("email: ", emailaddr)
      console.log("selectedUserType: ", selectedUserType.value)

      // Update FirebaseUser
      await updateFirebaseAuthUser(currentRowId.current, {
        displayName: displayName,
//        password: password,
      })

      // Check department
      console.log("department: ", department)
      
      try {
        const userRef = doc(db, "users", currentRowId.current)

        // Step 1: Clear the existing department array
        await updateDoc(userRef, {
          department: [],
        })

        const departmentArray = department.split(',').map(dep => dep.trim());
        await updateDoc(userRef, {
          name: displayName,
          department: arrayUnion(...departmentArray),
          officeLocation: officeLocation,
          jobLevel: jobLevel,
          isAdmin: selectedUserType.value == "admin" ? true : false,
          updatedAt: serverTimestamp()
        })
      } catch (err) {
        console.error (err)
      }
    }

    setDisplayName('')
    setEmailaddr('')
    setPassword('')

    // Close modal
    setShowModal(false)
  }

  const handleExcelSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("excelFile", excelFile)

    console.log("server action!")

    const resExcelReg = await addUsersbyxlsx(formData)
    console.log("resExcelReg: ", resExcelReg.creationResults.length)
    setRegisterExcel(resExcelReg)

    setIsSecondModalOpen(true)
//    onClose()
  }

  const handleSecondModalClose = () => {
    // Close both modals
    setIsSecondModalOpen(false)
    onClose()
  }
 
  const handleEditRow = async (el, idx) => {
    const { uid, email, name, password, officeLocation, department, jobLevel, isAdmin } = el.original
    console.log("el: ", el.original)
    console.log("isAdmin: ", isAdmin)

    currentRowId.current = uid
    setDisplayName(name)
    setEmailaddr(email)
    setPassword(password)
    setOfficeLocation(officeLocation)
    setDepartment(department)
    setJobLevel(jobLevel)

    // UserType
    isAdmin == true ? setSelectedUserType(selUserTypeOptions[1]) : setSelectedUserType(selUserTypeOptions[0])

    setModalButtonText("ユーザ更新")
    setModalHeadingText("ユーザ更新")
    setShowModal(true)
  }

  const handleDelRow = async (el, idx) => {
    const { uid, email } = el.original;

    console.log("uid: ", uid)
    currentRowId.current = uid
    setDelDialogTitle("ユーザ削除")
    setDelDialogBody(`このユーザを削除しますか？ : ${email}`)
    setIsPopOpen(true)
  }

  const doDelRow = async (uid) => {
    console.log("delete uid", uid)
    try {
//      await deletePostById("users", uid)
      // Remove FirebaseAuth User by uid
      await deleteFirebaseAuthUser(uid)

      // Then remove "users" collection: if el.uid == uid
      await deletePostById("users", uid)
      // Remove all "reports" related to UID
      await deletePostsByUid("reports", uid)

      const r_index = users.findIndex((u) => u.uid == uid)
      // delete row
      console.log("r_index", r_index)
      setUsers(
        users.filter((n, idx) => n.uid !== uid)
      )
    } catch (err) {
      console.error (err)
    }

    setIsPopOpen(false)
  }

  const cancelDelRow = async (e) => {
    setIsPopOpen(false)
  }

  const openModal = () => {
    // Add new record
    currentRowId.current = -1
    // Clear form
    setTagJapTitle('')
    setTagEngTitle('')
    setSelGenre('')
    setModalHeadingText("ユーザ追加")
    setModalButtonText("ユーザ登録")

    // Clear Fields
    setDisplayName("")
    setEmailaddr("")
    setPassword("")
    setDepartment("")
    setOfficeLocation("")
    setJobLevel("")
    // Set select to default (general user)
    setSelectedUserType(selUserTypeOptions[0])

    setShowModal(true)
  }

  const closeModal = (e) => {
    setShowModal(false)
  }

  return (
    <>
      {/* New User button */}
      {loginUser && loginUser.jobLevel == "管理者" &&
        <Box m={2}>
          <HStack>
            <Button
              type="button"
              colorScheme="yellow"
              onClick={() => openModal()}>
              ユーザ追加
            </Button>
            <Button colorScheme='blue' onClick={onOpen}>Excelから登録</Button>
          </HStack>
        </Box>
      }

{/* ChakraUI Table */}
<TableContainer>
  <Table variant='striped' colorScheme='gray'>
    <Thead>
      {table.getHeaderGroups().map(headerGroup => (
        <Tr key={`headerGroup-${headerGroup.id}`}>
          {headerGroup.headers.map(header => (
            <Th key={`header-${header.id}`} colSpan={header.colSpan}>
              {header.isPlaceholder ? null : (
                <div
                  className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{
                    asc: ' 🔼',
                    desc: ' 🔽',
                  }[header.column.getIsSorted()] ?? null}
                </div>
              )}
              {header.column.getCanFilter() && (
                <div>
                  <Filter column={header.column} />
                </div>
              )}
            </Th>
          ))}
          {loginUser && loginUser.jobLevel == "管理者" &&
            <Th colSpan="2">Action</Th>
          }
        </Tr>
      ))}
    </Thead>
    <Tbody>
      {table.getRowModel().rows.map((row, idx) => (
        <Tr key={`row-${row.id}`}>
          {row.getVisibleCells().map(cell => (
            <Td key={`cell-${row.id}-${cell.column.id}`}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </Td>
          ))}
          {loginUser && loginUser.jobLevel == "管理者" &&
            <Td key={`action-${row.id}`}>
              <HStack spacing={4}>
                <Button colorScheme='blue' onClick={() => handleEditRow(row, idx)}>Edit</Button>
                <Button colorScheme='red' onClick={() => handleDelRow(row, idx)}>Delete</Button>
              </HStack>
            </Td>
          }
        </Tr>
      ))}
    </Tbody>
  </Table>
</TableContainer>

      {/* Chakra Modal */}
      <Modal isOpen={isOpen} onClose={onClose} >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Excelでユーザ追加</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleExcelSubmit} encType="multipart/form-data">
            <ModalBody>
              <Stack spacing={4}>
                <Input variant="outline" type="file" accept=".xlsx" onChange={(e) => setExcelFile(e.target.files[0])} size="md" />
              </Stack>
            </ModalBody>

            <ModalFooter>
            <Button colorScheme='blue' mr={3} type="submit">
              Submit
            </Button>
            <Button colorScheme='red' mr={3} onClick={onClose}>
              Close
            </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Second Modal */}
      <Modal isOpen={isSecondModalOpen} onClose={handleSecondModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>結果</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
  {/* Display result information here */}
  {registerExcel && (
    <Stack spacing={3}>
      <Text>処理件数: {registerExcel.creationResults.length}</Text>
      <Text color="blue.500">登録成功: {registerExcel.registeredCount}</Text>
      <Text color="red.500">登録失敗: {registerExcel.failedCount}</Text>
      <Text>エラー:</Text>
      <Stack spacing={2} pl={4}>
        {registerExcel.errors.map((error, index) => {
          // If error is an object, handle it
          if (typeof error === 'object' && error !== null) {
            return (
              <Text color="red.500" key={index}>
                - {error.email && `Email: ${error.email}, `} 
                {error.error && `Error: ${error.error}`}
              </Text>
            );
          }
          // Otherwise, render it directly as text
          return (
            <Text color="red.500" key={index}>- {error}</Text>
          );
        })}
      </Stack>
      <Text>登録結果:</Text>
      <Stack spacing={2} pl={4}>
      {registerExcel.creationResults.map((result, index) => (
        <Text key={index}>
          {result.email} - {result.status}
          {result.error && (
            <Text color="red.500"> (Error: {result.error})</Text>
          )}
        </Text>
      ))}
      </Stack>
    </Stack>
  )}
</ModalBody>
          <ModalFooter>
            <Button colorScheme='red' onClick={handleSecondModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Begin Modal */}
      <div
        id="default-modal"
        hidden={!showModal}
        tabIndex="-1"
        aria-hidden="true"
        className="
        animate-slide-in-top opacity-0.3
        overflow-y-auto
        overflow-x-hidden
        w-full z-50
        fixed top-24
        "
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
                  <label
                    htmlFor="displayName"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      ユーザ名
                  </label>
                  {currentRowId.current == -1
                  // When adding new user
                  ?
                  <> 
                  <input
                  type="text"
                  name="displayName"
                  placeholder="ユーザ名"
                  className=
                    "bg-gray-50 border border-gray-300 text-gray-900 \
                    text-sm rounded-lg \
                    focus:ring-blue-500 focus:border-blue-500 \
                    block w-full p-2.5 \
                    dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
                </>
                  // When editing existing user
                  :
                  <>
                  <input
                  type="text"
                  name="displayName"
                  placeholder="ユーザ名(編集不可)"
                  className=
                    "bg-gray-50 border border-gray-300 text-gray-900 \
                    text-sm rounded-lg \
                    focus:ring-blue-500 focus:border-blue-500 \
                    block w-full p-2.5 \
                    dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  readOnly
                />
                </>
                }
                </div>
                <div>
                  {currentRowId.current == -1
                  // When adding new user
                  ? <>
                  <label
                  htmlFor="emailaddr"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    メールアドレス
                  </label>
                  <input
                  type="text"
                  name="emailaddr"
                  placeholder="メールアドレス"
                  className=
                    "bg-gray-50 border border-gray-300 text-gray-900 \
                    text-sm rounded-lg \
                    focus:ring-blue-500 focus:border-blue-500 \
                    block w-full p-2.5 \
                    dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  value={emailaddr}
                  onChange={(e) => setEmailaddr(e.target.value)}
                  required
                />
                </>
                  // When editing existing user
                  : <>
                  <label
                  htmlFor="emailaddr"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    メールアドレス(編集不可)
                  </label>
                  <input
                  type="text"
                  name="emailaddr"
                  placeholder="メールアドレス(編集不可)"
                  className=
                    "bg-gray-50 border border-gray-300 text-gray-900 \
                    text-sm rounded-lg \
                    focus:ring-blue-500 focus:border-blue-500 \
                    block w-full p-2.5 \
                    dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  value={emailaddr}
                  onChange={(e) => setEmailaddr(e.target.value)}
                  readOnly
                />
                </>
                  }
                </div>
                <div>
                {currentRowId.current == -1
                  // When adding new user
                  ?
                  <>
                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">パスワード</label>
                    <input
                    type="password"
                    name="password"
                    placeholder="パスワード"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  </>
                  // When editing existing user
                  :
                  <>
                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">パスワード(編集不可)</label>
                    <input
                    type="password"
                    name="password"
                    placeholder="パスワード"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    readOnly
                  />
                  </>
                }
                </div>
                <div>
                  <label htmlFor="department" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">部署</label>
                  <input
                    type="text"
                    name="department"
                    placeholder="部署"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="officeLocation" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">支店</label>
                  <input
                    type="text"
                    name="officeLocation"
                    placeholder="支店"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="jobLevel" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">役職</label>
                  <input
                    type="text"
                    name="jobLevel"
                    placeholder="役職"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={jobLevel}
                    onChange={(e) => setJobLevel(e.target.value)}
                    required
                  />
                </div>
                <label htmlFor="userTypeSelBox" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">ユーザ種別選択</label>
                <Select
                  options={selUserTypeOptions}
                  id="userTypeSelBox"
                  name="userTypeSelBox"
                  instanceId="userTypeSelBox"
//                  isMulti
                  className="basic-multi-select"
                  classNamePrefix="userTypeSelBox"
                  value={{ value: selectedUserType.value, label: selectedUserType.label }}
//                  defaultValue={selectedTemplateVal}
                  onChange={(val) => {
                    val ? setSelectedUserType(val) : null
                  }}
                />
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


    <div hidden={!isPopOpen} className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

  <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
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
      multiple
      onChange={e => {
        const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
        console.log('Selected Values:', selectedValues);
        column.setFilterValue(selectedValues);
      }}
      value={columnFilterValue || []}
      >
      {/* See faceted column filters example for dynamic select options */}
      <option value="">All</option>
      <option value="営業1部">営業1部</option>
      <option value="営業2部">営業2部</option>
      <option value="営業3部">営業3部</option>
      <option value="営業4部">営業4部</option>
      <option value="岡山営業所">岡山営業所</option>
      <option value="監査室">監査室</option>
      <option value="九州営業所">九州営業所</option>
      <option value="経営企画部">経営企画部</option>
      <option value="経理部">経理部</option>
      <option value="広島営業所">広島営業所</option>
      <option value="取締役">取締役</option>
      <option value="常務取締役">常務取締役</option>
      <option value="総務部">総務部</option>
      <option value="代表取締役社長">代表取締役社長</option>
      <option value="大阪支店">大阪支店</option>
      <option value="物流グループ">物流グループ</option>
      <option value="名古屋支店">名古屋支店</option>
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
      <option value="広島">広島</option>
      <option value="岡山">岡山</option>
      <option value="九州">九州</option>
    </select>
  ) : filterVariant === 'select_jobLevel' ? (
    <select
      onChange={e => column.setFilterValue(e.target.value)}
      value={columnFilterValue?.toString()}
    >
      {/* See faceted column filters example for dynamic select options */}
      <option value="">All</option>
      <option value="管理者">管理者</option>
      <option value="責任者">責任者</option>
      <option value="">社員</option>
    </select>
  ): (
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

function MultiSelect({ options, value, onChange }) {
  const handleSelectChange = (event) => {
    const { options } = event.target;
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);

    onChange(selectedValues);
  };

  return (
    <select multiple={true} value={value} onChange={handleSelectChange}>
      {options.map(option => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export default UserAdmin