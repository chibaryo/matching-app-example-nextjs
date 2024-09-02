'use client'
import React, { useRef, useEffect, useState, useContext } from "react";
import { useRouter, usePathname } from 'next/navigation'
import { useThemeContext } from "@/context/ThemeContext";
import Select from 'react-select'
import { onAuthStateChanged } from 'firebase/auth'

// ChakraUI
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Button,
  Box,
  Stack,
} from '@chakra-ui/react'
import NextLinkButton from '@/components/common/NextLinkButton'

// TanStack
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender } from '@tanstack/react-table';
import { columns } from './columns';


import { query, where, getDocs, collection, onSnapshot, serverTimestamp, setDoc, doc } from 'firebase/firestore'
import { firebaseApp, firebaseAuth, db } from '@/utils/firebase/firebaseinit'

import bgColorList from '@/assets/data/colorlist.json'

// Context
import { useAuthContext } from '@/context/AuthContext'
import { useToast } from '@chakra-ui/react'

// Server Actions
import { getUserByUid, batchAddisConfirmed, deletePostById, readFromFirestore, getParentEngTitlesFromCurrentSubscriber, postToFirestore } from '@/action/google/firestore'
import { fcmSendToTopic } from "@/action/google/sendToTopic"
import { fcmSubscribeToTopic } from '@/action/google/subscribeToTopic'
import { uploadImage } from '@/action/google/cloudstorage'
// Firestore-admin
import { deleteCollection } from '@/action/google/firestoreAdmin'

import Link from "next/link";
import { sendSilentPush } from "@/action/google/sendSilentPush";

const NotiAdmin = () => {
  const { currentUser, token } = useAuthContext()
  const running = useRef(true)
  const toast = useToast()

  const [notifications, setNotifications] = useState([])
  const [ showModal, setShowModal ] = useState(false)
  const [ notiTitle, setNotiTitle ] = useState("")
  const [ notiBody, setNotiBody ] = useState("")
  const [ notiUrl, setNotiUrl ] = useState("")
  const [ notiTopic, setNotiTopic ] = useState("")
  const [ notiType, setNotiType ] = useState("")
  const [ reviewPictures, setReviewPictures ] = useState(null)
  const [ modalButtonText, setModalButtonText ] = useState("タグ登録")
  const [ modalHeadingText, setModalHeadingText ] = useState("タグ追加")
  const [ uploadFile, setUploadFile ] = useState(null)

  const [ items, setItems ] = useState([])
  const [ notiTemplates, setNotiTemplates ] = useState([])

  const [ selectedVal, setSelectedVal ] = useState(null)
  const [ selectedNotiTypeVal, setSelectedNotiTypeVal ] = useState(null)
  const [ selectedTemplateVal, setSelectedTemplateVal ] = useState(null)

  const [ selOptions, setSelOptions ] = useState([])
  const [ selOptionsNotiTypes, setSelOptionsNotiTypes ] = useState([])
  const [ selNotiTemplateOptions, setNotiTemplateSelOptions ] = useState([])

  const router = useRouter()
  const { bgColor, theme } = useThemeContext()

  const mainSidebarColor = bgColorList[theme.name].color[bgColor].main
  const textSidebarColor = bgColorList[theme.name].color[bgColor].text
  const profileSidebarColor = bgColorList[theme.name].color[bgColor].profile
  const notifySidebarColor = bgColorList[theme.name].color[bgColor].notify
  const [ loginUser, setLoginUser ] = useState(null)

  // TanStack Table Filters
  const [columnFilters, setColumnFilters] = useState([])

  useEffect(() => {
    (async () => {
      if (process.env.NODE_ENV == 'development') {
        if (running.current) {
          running.current = false
          return
        }
      }

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          console.log('User Uid: ', user.uid)
          console.log('User email: ', user.email)
          // Get user info from Firestore
          const resUser = await getUserByUid(user.uid)
          console.log("user info: ", resUser)
  
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
            })
          }
   
        } else {
          console.log("No user is signed in.")
        }
      })


      // Load all tags from Firestore
      const resp = await readFromFirestore("tags")
      setItems(JSON.parse(resp.posts))

      // Load notifications
      const notificationsCollectionRef = collection(db, 'notifications')
      const notificationsUnsubscribe = onSnapshot(notificationsCollectionRef, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data(),
        }))
        setNotifications(notificationsData) // Update the state with new data
      })

      const notisResp = await readFromFirestore("notifications")
      setNotifications(JSON.parse(notisResp.posts))

      // Load notiTemplates
      const templatesCollectionRef = collection(db, 'templates')
      const templatesUnsubscribe = onSnapshot(templatesCollectionRef, (snapshot) => {
        const templatesData = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data(),
        }))
        setNotiTemplates(templatesData) // Update the state with new data
      })

      // Cleanup the listener on unmount
      return () => {
        templatesUnsubscribe()
        notificationsUnsubscribe()
      }

    })()
  }, [])

  const [columnVisibility, setColumnVisibility] = useState({
    notificationId: false, //hide this column by default
  });
  
  // TanStack Table
  const table = useReactTable({
    data: notifications,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnVisibility,
      columnFilters,
     },
     onColumnVisibilityChange: setColumnVisibility,
     onColumnFiltersChange: setColumnFilters,
  });

  const Bfunction = (() => {
    table.getHeaderGroups()[0].headers[2].column.setFilterValue("admin");
  })

  // Danger!!
  const handleDeleteNotiCollection = async () => {
    try {
      await deleteCollection("notifications", 50)
      console.log("All documents in notifications collection have been deleted.")
    } catch (err) {
      console.error("Error deleting documents: ", err)
    }
  }

  // Danger!!
  const handleDeleteReportCollection = async () => {
    try {
      await deleteCollection("reports", 50)
      console.log("All documents in reports collection have been deleted.")
    } catch (err) {
      console.error("Error deleting documents: ", err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("uploadFile: ", uploadFile)
    
    let imagepath = []
    if (uploadFile != null) {
      // conv image
      let imgArray = Buffer.from(new Uint8Array(await uploadFile.arrayBuffer()))

      // Upload
      const base64data = btoa([...imgArray].map(n => String.fromCharCode(n)).join(""))
      imagepath = await uploadImage({data: base64data, dirPrefix: "images", name: uploadFile.name, type: uploadFile.type})
      console.log("imagepath", imagepath)

    } else {
      imagepath = null
    }

    //
    const payload = {
      topic: notiTopic["value"],
      title: notiTitle,
      body: notiBody,
      url: notiUrl ?? "",
      type: notiType,
//      image: imagepath ? imagepath[0] : ""
    }
    try {
      fcmSendToTopic(payload)
      // Show toast
      toast({
        title: `${notiTopic["value"]}宛てに通知を送信しました`,
        position: "bottom",
        status: "success",
      })

      // Update notifications
      //const notisResp = await readFromFirestore("notifications")
      //setNotifications(JSON.parse(notisResp.posts))

      // Close modal
      setShowModal(false)
    } catch (err) {
      console.error (err)
      toast({
        title: "通知送信に失敗しました",
        position: "bottom",
        status: "error",
      })
      setShowModal(false)
    }
  }

  // Clear form
  const handleCancelSubmit = async () => {
    setNotiTitle("")
    setNotiBody("")
    setNotiTopic("")
    setNotiType("")

    setSelectedTemplateVal(null)
    setSelectedNotiTypeVal(null)
    setSelectedVal(null)

    setNotiUrl("")
  }

  const openModal = async () => {
    console.log("F!!")
    setNotiTitle("")
    setNotiBody("")

    //
    let sel_options = []
    items.forEach((el) => {
      sel_options.push({ value: el.tagEngTitle, label: el.tagJapTitle })
    })
    setSelOptions(
      [...sel_options,
        {value: "notice_all", label: "全体通知"},
        {value: "notice_tokyo", label: "東京"},
        {value: "notice_nagoya", label: "名古屋"},
        {value: "notice_osaka", label: "大阪"},
        {value: "notice_hiroshima", label: "広島"},
        {value: "notice_okayama", label: "岡山"},
        {value: "notice_kyushu", label: "九州"},
        {value: "test_adm_2024", label: "管理者テスト2024"},
      ]
    )

    setSelOptionsNotiTypes(
      [
        { value: "enquete", label: "アンケート" },
        { value: "confirmation", label: "確認のみ" },
      ]
    )
    // notitemplates
    sel_options = []
    notiTemplates.forEach((el) => {
      sel_options.push({ value: el, label: el.notiTitle })
    })
    setNotiTemplateSelOptions([
        ...sel_options
    ])

    // Add new record
    setModalHeadingText("通知送信")
    setModalButtonText("送信")
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const batchAddToNoticeAll = async () => {
    const collectionRef = collection(db, "unregistered_users")
    const q = query(collectionRef, where("fcmToken", "!=", null))
    const querySnapshot = await getDocs(q)

    querySnapshot.forEach(async(doc) => {
      console.log(doc.id, "", doc.data()["fcmToken"])
      await fcmSubscribeToTopic(doc.data()["fcmToken"], "notice_all")
    })

  }

  const addToTest2024 = async () => {
    await fcmSubscribeToTopic(
      "fCGkESSZVEz-tIiIZEIW_M:APA91bFpWJ6cGIP8KwlroNUPzEL4OAHh_Ege4pJX_6RGpXJgMJe1QYFkQOhwi5bovaOwBlZJ6J6UmlBX96WAlwB0RJwMxVdc0AyBl1Mw8bDk2TpGZNbTk5WgPo-VShdoRSGcbc5VaDpN",
      "test_2024"
    )
  }

  const showNoti = async () => {
      // Noti setup
      if (!("Notification" in window)) {
        alert("this browswer is not compatible with desktop notification");
      } else if (Notification.permission === "granted") {
        console.log("granted");
        const notification = new Notification(
          "Hello", {
            body: "body!",
            image: "https://yuko-sasaoka.sakura.ne.jp/wp-content/uploads/2023/12/IMG_4896.jpeg"
          }
        );
        notification.onclick = () => {
          window.open("https://arctimes.com")
        }
      } else if (Notification.permission === "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            const notification = new Notification("Hello!!");
          }
        })
      }
  }

  return (
    <>
      {loginUser && loginUser.jobLevel == "管理者" &&
      <Box m={2}>
        <Button
          type="button"
          colorScheme="yellow"
          onClick={() => openModal()}>
          通知送信...
        </Button>
        <Button
          type="button"
          colorScheme="purple"
          onClick={() => sendSilentPush()}>
          Silent PUsh
        </Button>
      </Box>
      }
{/*
      <Stack direction={['column', 'row']} spacing='24px'>
        <Button
          type="button"
          colorScheme="red"
          onClick={handleDeleteNotiCollection}
        >
          全ての過去通知を削除
        </Button>

        <Button
          type="button"
          colorScheme="red"
          onClick={handleDeleteReportCollection}
        >
          全ての過去レポートを削除
        </Button>
      </Stack>
*/}

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
                <label htmlFor="notiTemplateSelBox" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">テンプレート選択（任意）</label>
                <Select
                  options={selNotiTemplateOptions}
                  id="notiTemplateSelBox"
                  name="notiTemplateSelBox"
                  instanceId="notitemplateselectbox"
//                  isMulti
                  className="basic-multi-select"
                  classNamePrefix="notitemplateselect"
                  value={selectedTemplateVal}
                  isClearable
                  onChange={(e) => {
                    setSelectedTemplateVal(e)
                    if (e != null) {
                        const selected = e.value

                        setNotiTitle(e.value["notiTitle"])
                        setNotiBody(e.value["notiBody"])
                    }
                  }}
                  />
                <div>
                  <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">通知タイトル</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="title"
                    value={notiTitle}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    onChange={(e) => setNotiTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="body" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">本文</label>
                  <input
                    type="text"
                    name="body"
                    placeholder="body"
                    value={notiBody}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    onChange={(e) => setNotiBody(e.target.value)}
                    required
                  />
                </div>
{/*                 <div>
                  <label htmlFor="topic" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">トピック名</label>
                  <input
                    type="text"
                    name="topic"
                    placeholder="topic"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    onChange={(e) => setNotiTopic(e.target.value)}
                    required
                  />
                </div> */}
                <label htmlFor="selectbox" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">送信先トピック選択</label>
                <Select
                  options={selOptions}
                  id="selectbox"
                  name="selectbox"
                  instanceId="selectbox"
//                  isMulti
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={selectedVal}
                  isClearable
                  onChange={(e) => {
                    setSelectedVal(e)
                    if (e != null) {
//                        const selected = e.value
                        setNotiTopic(e)
                    }
                  }}
                  />
                <label htmlFor="selectNotiTypeBox" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">通知タイプ選択</label>
                <Select
                  options={selOptionsNotiTypes}
                  id="selectNotiTypeBox"
                  name="selectNotiTypeBox"
                  instanceId="selectNotiTypeBox"
//                  isMulti
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={selectedNotiTypeVal}
                  isClearable
                  onChange={(e) => {
                    setSelectedNotiTypeVal(e)
                    if (e != null) {
                        setNotiType(e)
                    }
                  }}
                  />
                {/* 
                <div className='mb-4'>
                  <label htmlFor='reviewPictures' className='block text-gray-700 text-sm font-bold mb-2'>画像
                    <input
                      type="file"
                      name="画像"
                      className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                      placeholder="画像"
                      accept='.jpg, .png'
                      multiple
                      onChange={(e) => setUploadFile(e.target.files[0])}
                    />
                  </label>
                </div>
                */}
                {/*
                <div>
                  <label htmlFor="url" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">参照URL</label>
                  <input
                    type="text"
                    name="selGenre"
                    placeholder="url"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={notiUrl}
                    onChange={(e) => {
                        setNotiUrl(e.target.value)
                    }}
                  />
                </div>
                */}
                {/* register button */}
                <button
                  type="submit"
                  className="w-full text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  style={theme.name == "dark" ? { backgroundColor: mainSidebarColor, color: textSidebarColor } : { backgroundColor: textSidebarColor, color: mainSidebarColor }}
                >
                  {modalButtonText}
                </button>
                <Button
                    colorScheme="gray"
                    onClick={handleCancelSubmit}
                    >
                    フォームをクリア
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* End modal */}

{/*
      <button
        type="button"
        className='text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:bg-gradient-to-br focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800 font-medium rounded-lg text-md px-5 py-2.5 text-center mx-2 my-2'
        onClick={() => batchAddToNoticeAll()}>
        トークン一括登録(notice_all)
      </button>
      <button
        type="button"
        className='text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:bg-gradient-to-br focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800 font-medium rounded-lg text-md px-5 py-2.5 text-center mx-2 my-2'
        onClick={() => addToTest2024()}>
        Topicに登録(test2024)
      </button>
      <button
        id="push"
        type="button"
        className='text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:bg-gradient-to-br focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800 font-medium rounded-lg text-md px-5 py-2.5 text-center mx-2 my-2'
        onClick={() => showNoti()}>
        showNoti
      </button>
*/}

      {/* ChakraUI Table */}
      <TableContainer className="relative overflow-x-auto shadow-md">
      <Table
        __css={{"table-layout": "fixed", width: "full" }}
        variant='striped'
        colorScheme='gray'
      >
        <Thead>
        {table.getHeaderGroups().map(headerGroup => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <Th key={header.id} colSpan={header.colSpan}>
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
                )
              })}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {table.getRowModel().rows.map(row => {
            return (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <Td isTruncated key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Td>
                  )
                }
                )}
                <Td>
                  <NextLinkButton
                    colorScheme='blue'
                    isDiabled
                    href={`/admin/noti/${row.original.notificationId}`}
                    >
                      集計表示
                  </NextLinkButton>
                </Td>

              </Tr>
            )
          })}
        </Tbody>
      </Table>
    </TableContainer>

{/* 
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                title
              </th>
              <th scope="col" className="px-6 py-3">
                body
              </th>
              <th scope="col" className="px-6 py-3">
                image
              </th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((el, idx) => {
              return (
                <React.Fragment key={idx}>
                  <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                    <th scope="row" className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">{el.title}</th>
                    <td className="px-6 py-4 text-sm">{el.body}</td>
                    <td className="px-6 py-4 text-sm">{el.image}</td>
                  </tr>
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
*/}



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
  ) : filterVariant === 'select_topic' ? (
    <select
      onChange={e => column.setFilterValue(e.target.value)}
      value={columnFilterValue?.toString()}
    >
      {/* See faceted column filters example for dynamic select options */}
      <option value="">全件</option>
      <option value="notice_all">全体配信</option>
      <option value="notice_tokyo">東京</option>
      <option value="notice_osaka">大阪</option>
      <option value="notice_nagoya">名古屋</option>
      <option value="test_adm_2024">Test_Adm_2024</option>
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


export default NotiAdmin