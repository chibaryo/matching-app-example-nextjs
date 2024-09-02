'use client'
import { signInWithEmailAndPassword } from 'firebase/auth'
import React, { useRef, useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { firebaseApp, firebaseAuth } from '@/utils/firebase/firebaseinit'
import { fetchRecordById } from '@/action/google/firestore'

import { fcmSubscribeToTopic } from '@/action/google/subscribeToTopic'

const LoginFormModal = (props) => {
  const router = useRouter()

  const [ displayName, setDisplayName ] = useState("")
  const [ email, setEmail ] = useState("")
  const [ password, setPassword ] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      )
      console.log("uid", response.user.uid)
      // Need to save userdata to Firestore?
      const ret = await fetchRecordById(response.user.uid, "users")
      console.log("ret: ", ret)

      // Add fcmToken to "notice_all"
      //await fcmSubscribeToTopic(fcmToken, "notice_all")

      // Goto /admin if Admin
      if (ret["isAdmin"]) {
        router.push('/admin')
      } else {
        router.push("/dashboard")
      }

    } catch (err) {
      console.error (err)
    }
  }

  return (
    <div hidden={!props.showLoginModal} className="fixed z-10 inset-0 overflow-y-auto">
      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white w-1/2 p-6 rounded shadow-md">
          <div className="flex justify-end">
            {/* <!-- Close Button --> */}
            <button
              id="closeContactForm"
              onClick={() => props.cancelLogin()}
              className="text-gray-700 hover:text-red-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12">
                </path>
              </svg>
            </button>
          </div>
          <h2 className="text-2xl font-bold mb-4">ログイン</h2>

          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                パスワード
              </label>
              <input
                type="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
              ログイン
            </button>
            <button
              type="button"
              onClick={() => props.cancelLogin()}
              className="bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-700">
              キャンセル
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginFormModal
