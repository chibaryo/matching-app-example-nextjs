'use client'

import React, { useRef, useEffect, useState, useContext, useMemo } from "react";

// Server Actions
import { updateFirestoreWithId, postToFirestoreWithId, deletePostById, removePostsById, readFromFirestore, postToFirestore } from '@/action/google/firestore'

// Components
import bgColorList from '@/assets/data/colorlist.json'
import DeleteTagModalPopup from '@/components/common/DeleteTagModalPopup'
import { useThemeContext } from "@/context/ThemeContext";
import PaginationManipButtons from '@/components/common/PaginationManipButtons'

const TagAdmin = () => {
  const running = useRef(true)
  const currentRowId = useRef(null)

  const initialPage = useRef(1)
  const currentPage = useRef(null)
  const totalPage = useRef(null)
  const [ isNotificationEnabled, setIsNotificationEnabled ] = useState(false)
  const [ tableContents, setTableContents ] = useState([])
  const step = 5

  const [ tags, setTags ] = useState([])
  const [ isPopOpen, setIsPopOpen ] = useState(false)
  const [ tagJapTitle, setTagJapTitle ] = useState('')
  const [ tagEngTitle, setTagEngTitle ] = useState('')
  const [ selGenre, setSelGenre ] = useState('')

  const [ showModal, setShowModal ] = useState(false)
  const [ delDialogTitle, setDelDialogTitle ] = useState('タグ削除')
  const [ delDialogBody, setDelDialogBody ] = useState('タグ削除')
  const [ modalButtonText, setModalButtonText ] = useState("タグ登録")
  const [ modalHeadingText, setModalHeadingText ] = useState("タグ追加")

  const { bgColor, theme } = useThemeContext()

  const mainSidebarColor = bgColorList[theme.name].color[bgColor].main
  const textSidebarColor = bgColorList[theme.name].color[bgColor].text
  const profileSidebarColor = bgColorList[theme.name].color[bgColor].profile
  const notifySidebarColor = bgColorList[theme.name].color[bgColor].notify

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

      const resp = await readFromFirestore("tags")
      console.log("tags", JSON.parse(resp.posts))
      setTags(JSON.parse(resp.posts))
//      setTags((preData) => {
//        const total = (preData.length % step == 0) ? (preData.length / step) : (Math.floor(preData.length / step) + 1)
//        totalPage.current = total
        // Show page 1 contents
//        setPaginatedTableContents(currentPage.current, step)
//      })

    })()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (currentRowId.current == -1) {
      // Add new record
      console.log("-1? ")
      console.log(currentRowId.current)
      const resp = await postToFirestoreWithId('tags', {
        tagJapTitle: tagJapTitle,
        tagEngTitle: tagEngTitle,
      })
      // Add new array to tags
      setTags([...tags, { tagJapTitle: tagJapTitle, tagEngTitle: tagEngTitle, id: resp.id}])
    } else if (typeof(currentRowId.current) === "string" || currentRowId.current instanceof String) {
      // Update existing record
      console.log(" >= 0 ? ")
      console.log(currentRowId.current)

      const resp = await updateFirestoreWithId('tags', {
        tagJapTitle: tagJapTitle,
        tagEngTitle: tagEngTitle,
      }, currentRowId.current)

      // Renew tags array
      const r_Index = tags.findIndex((u) => u.id == currentRowId.current)
      setTags(tags.map((u, idx) => (idx == r_Index ? {tagEngTitle: tagEngTitle, tagJapTitle: tagJapTitle, id: currentRowId.current} : u)))
    }

    setTagJapTitle('')
    setTagEngTitle('')

    // Close modal
    setShowModal(false)
  }
 
  const handelEditRow = async (el, idx) => {
    currentRowId.current = el.id
    setTagJapTitle(el.tagJapTitle)
    setTagEngTitle(el.tagEngTitle)
    setModalButtonText("タグ更新")
    setModalHeadingText("タグ更新")
    setShowModal(true)
  }

  const handelDelRow = async (el, idx) => {
    currentRowId.current = el.id
    setDelDialogTitle("タグ削除")
    setDelDialogBody(`このタグを削除しますか？ : ${el.tagJapTitle}`)
    setIsPopOpen(true)
  }

  const doDelRow = async (uid) => {
    console.log("delete uid", uid)
    try {
      await deletePostById("tags", uid)
      const r_index = tags.findIndex((u) => u.id == uid)
      // delete row
      console.log("r_index", r_index)
      setTags(
        tags.filter((n, idx) => n.id !== uid)
      )
    } catch (err) {
      console.error (err)
    }

    // Then remove "tagtidy" collection: if el.id == tagId
    await removePostsById("tagtidy", uid)

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
    setModalHeadingText("タグ追加")
    setModalButtonText("タグ登録")
    setShowModal(true)
  }

  const closeModal = (e) => {
    setShowModal(false)
  }

  return (
    <>
      {/* New User button */}
      <button
        type="button"
        className='text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:bg-gradient-to-br focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800 font-medium rounded-lg text-md px-5 py-2.5 text-center mx-2 my-2'
        onClick={() => openModal()}>
        タグ登録
      </button>

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
                  <label htmlFor="tagJapTitle" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">タグ名</label>
                  <input
                    type="text"
                    name="tagJapTitle"
                    placeholder="タグ名"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={tagJapTitle}
                    onChange={(e) => setTagJapTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="tagEngTitle" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">英語キー</label>
                  <input
                    type="text"
                    name="tagEngTitle"
                    placeholder="英語キー"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={tagEngTitle}
                    onChange={(e) => setTagEngTitle(e.target.value)}
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

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-6 py-3">
                    タグ名
                </th>
                <th scope="col" className="px-6 py-3">
                    英語キー
                </th>
                <th colSpan="2" scope="col" className="px-6 py-3 text-center">
                    Action
                </th>
            </tr>
        </thead>
        <tbody>
        {tags.map((el, idx) => {
          return (
            <React.Fragment key={idx}>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">{el.tagJapTitle}</th>
                      <td className="px-6 py-4 text-sm">{el.tagEngTitle}</td>
                      <td className="px-6 py-4 text-sm">
                         <a href="#" className="font-medium text-blue-600 dark:text-blue-500 hover:underline" onClick={() => handelEditRow(el, idx)}>Edit</a>
                      </td>
                      <td className="px-6 py-4 text-sm">
                         <a href="#" className="font-medium text-red-600 dark:text-red-500 hover:underline" onClick={() => handelDelRow(el, idx)}>Delete</a>
                      </td>
                    </tr>
            </React.Fragment>
          )
        })}
        </tbody>
      </table>
    </div>

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

export default TagAdmin