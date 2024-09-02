'use client'
import { createUserWithEmailAndPassword, linkWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth'
import React, { useRef, useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { updateDoc, collection, doc, setDoc, getDocs, where, query, deleteDoc } from 'firebase/firestore'

import { db, firebaseApp, firebaseAuth } from '@/utils/firebase/firebaseinit'
import { fcmSubscribeToTopic } from '@/action/google/subscribeToTopic'

const SignupFormModal = (props) => {
  const router = useRouter()

  const [ displayName, setDisplayName ] = useState("")
  const [ email, setEmail ] = useState("")
  const [ password, setPassword ] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (props.modalMode == "initial_reg"){
      console.log("[mode]: initial_reg")
      // 新規登録ルーチン
      try {
        const response = await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        )
        // Update displayName
        await updateProfile(firebaseAuth.currentUser, { displayName: displayName })
        console.log("ersponse", response.user.stsTokenManager.expirationTime)
        // Need to save userdata to Firestore?


        // Close modal
        props.cancelSignup()
        // Add fcmToken to "notice_all"
        await fcmSubscribeToTopic(fcmToken, "notice_all")

        // Goto home
//        router.push('/home')
      } catch (err) {
        console.error (err)
      }
      // 本登録ルーチン
      } else if (props.modalMode == "upgrade_reg") {
        console.log("[mode]: upgrade_reg")
        console.log("displayName: ", displayName)
        try {
          const credential = EmailAuthProvider.credential(email, password)
          await linkWithCredential(firebaseAuth.currentUser, credential)
          // Update displayName
          await updateProfile(firebaseAuth.currentUser, { displayName: displayName })
          // Need to save userdata to Firestore?
          const docRef = doc(db, "users", firebaseAuth.currentUser.uid)
          await updateDoc(docRef, {
            displayName: displayName,
            email: email,
            password: password
          })

          // Close modal
          props.cancelSignup()
      
        } catch (err) {
          console.error (err)
        }
      }
  }

  return (
    <div hidden={!props.showSignupModal} className="fixed z-10 inset-0 overflow-y-auto">
      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white w-1/2 p-6 rounded shadow-md">
          <div className="flex justify-end">
            {/* <!-- Close Button --> */}
            <button
              id="closeContactForm"
              onClick={() => props.cancelSignup()}
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
          <h2 className="text-2xl font-bold mb-4">{props.modaltitle}</h2>

          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                名前
              </label>
              <input
                type="text"
                name="displayName"
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500"
               />
            </div>
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
              登録
            </button>
            <button
              type="button"
              onClick={() => props.cancelSignup()}
              className="bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-700">
              キャンセル
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SignupFormModal
