'use client'

import React, { useRef, useEffect, useState, FormEvent } from 'react'
import { getAuth, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth'
import { initializeApp, cert } from 'firebase/app'
import { firebaseApp, firebaseAuth, db } from '@/utils/firebase/firebaseinit'
import { useRouter } from 'next/navigation'
import { getMessaging, onMessage, getToken } from 'firebase/messaging'

// Context
import { useAuthContext } from '@/context/AuthContext'
import { useFcmToken } from '@/hooks/fcmToken/useFcmToken'
import { useToast } from '@chakra-ui/react'

// Componnets, parts
import SignupFormModal from '@/components/common/form/signupformmodal'
import LoginFormModal from '@/components/common/form/loginformmodal'
import { collection, serverTimestamp, setDoc, doc } from 'firebase/firestore'
import { fcmSubscribeToTopic } from '@/action/google/subscribeToTopic'
import { readFcmTokenFromCookie } from '@/action/actions'

//
const Login = () => {
  const running = useRef(true)
  const router = useRouter()
  const toast = useToast()

  const { fcmToken, notificationPermissionStatus } = useFcmToken()

  const { currentUser, token } = useAuthContext()
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [modaltitle, setModalTitle] = useState("")
  const [modalMode, setModalMode] = useState("")

  useEffect(() => {
    (async () => {
      if (process.env.NODE_ENV == 'development') {
        if (running.current) {
          running.current = false
          return
        }
      }

/*      const resp = await readFcmTokenFromCookie()
      if (resp?.fcmToken?.value) {
        console.log("store to unregistered_users")
        // Store fcmToken to Firestore/"unregistered_users"
        const unregUserRef = doc(collection(db, "unregistered_users"))
        try {
          await setDoc(unregUserRef, {
            fcmToken: resp.fcmToken.value,
            createdAt: serverTimestamp(),
          })
          toast({
            title: "全体通知グループに入りました",
            position: "bottom",
            status: "success",
          })

        } catch (err) {
          console.error(err)
        }
        // Also subscribe to "notice_all" topic
        await fcmSubscribeToTopic(resp.fcmToken.value, "notice_all")

      }
*/

    })()
  }, [])

  const handleAnonClick = async (e) => {
    console.log("bobob")
    // Anon login
    try {
      console.log("bobob")
      //      const firebaseAuth = getAuth(firebaseApp)
      signInAnonymously(firebaseAuth).then(async (e) => {
        if (e.user) {
          console.log("e.user: ", e.user)
          // Add anonymous user to Firestore "users" /w fcmToken
          const userRef = doc(db, "users", e.user.uid)
          const payload = {
            "displayName": "",
            "email": "",
            "photoURL": "",
            "fcmToken": fcmToken,
            "comment": "",
          }
          await setDoc(
            userRef,
            {
              ...payload,
              createdAt: serverTimestamp()
            }
          )

          // Add fcmToken to "notice_all"
          await fcmSubscribeToTopic(fcmToken, "notice_all")

          //          router.push('/home')
        } else {
          console.log("bobob")
        }
      })
    } catch (err) {
      console.error(err)

    }
  }

  const handleSignUp = async (e) => {
    // open modal
    setModalMode("initial_reg")
    setModalTitle("ユーザ登録")
    setShowSignupModal(true)
  }
  const handleSignIn = async (e) => {
    setShowLoginModal(true)
  }

  const cancelSignup = () => {
    setShowSignupModal(false)
  }
  const cancelLogin = () => {
    setShowLoginModal(false)
  }


  return (
    <>
      ログイン
      <div>
{/*        <button
          type="button"
          className='text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-md px-5 py-2.5 text-center mr-2 mb-2'
          onClick={(e) => handleSignUp(e)}
        >
          アカウント作成
        </button>  */}

        <button
          type="button"
          className='text-white bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 hover:bg-gradient-to-br focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg text-md px-5 py-2.5 text-center mr-2 mb-2'
          onClick={(e) => handleSignIn(e)}>
          ログイン
        </button>
{/*        <button
          type="button"
          className='text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-md px-5 py-2.5 text-center mr-2 mb-2'
          onClick={(e) => handleAnonClick(e)}
        >
          匿名ユーザとしてログイン
        </button> */}


      </div>

      {/* Signup Modal */}
      <SignupFormModal
        showSignupModal={showSignupModal}
        cancelSignup={cancelSignup}
        modaltitle={modaltitle}
        modalMode={modalMode}
      />
      <LoginFormModal
        showLoginModal={showLoginModal}
        cancelLogin={cancelLogin}
      />
    </>
  )
}

export default Login
