'use client'
import React, { useRef, useEffect, useState, FormEvent } from 'react'
import { getAuth, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth'
import { initializeApp, cert } from 'firebase/app'
import { firebaseApp, firebaseAuth, db } from '@/utils/firebase/firebaseinit'
import { useRouter } from 'next/navigation'

import SignupFormModal from '@/components/common/form/signupformmodal'

const HomeScreen = () => {
  const [ showSignupModal, setShowSignupModal ] = useState(false)
  const [ showLoginModal, setShowLoginModal ] = useState(false)
  const [ modaltitle, setModalTitle ] = useState("")
  const [ modalMode, setModalMode ] = useState("")

  const router = useRouter()

  const handleSignUp = async (e) => {
    // open modal
    setModalMode("upgrade_reg")
    setModalTitle("ユーザ本登録")
    setShowSignupModal(true)
    router.refresh()    
  }

  const cancelSignup = () => {
    setShowSignupModal(false)
  }

  //  signInAnonymously(firebaseAuth).then(async (e) => {

  return (
    <>
      {/* New User button */}
      <button
        type="button"
        className='text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:bg-gradient-to-br focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800 font-medium rounded-lg text-md px-5 py-2.5 text-center mx-2 my-2'
        onClick={() => handleSignUp()}>
        本登録する
      </button>

      {/* Signup Modal */}
      <SignupFormModal
        showSignupModal={showSignupModal}
        cancelSignup={cancelSignup}
        modaltitle={modaltitle}
        modalMode={modalMode}
      />

    </>
  )
}

export default HomeScreen