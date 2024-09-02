import { initializeApp, cert } from 'firebase/app'
import { getAnalytics } from "firebase/analytics";

import { getAuth, signOut, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { removeCookie } from '@/action/actions'
import { getMessaging, isSupported } from 'firebase/messaging';

// Next redirect
import { redirect } from 'next/navigation'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig)

const firebaseAuth = getAuth(firebaseApp)

//if (isSupported) {
//  const messaging = getMessaging(firebaseApp)
//}

const db = getFirestore(firebaseApp)
const vapidKey = {
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_VAPID_KEY,
}

//const analytics = isSupported ? getAnalytics(firebaseApp) : null

const logout = async () => {
  let result = false
//  const firebaseAuth = getAuth(firebaseApp)
  try {
    await signOut(firebaseAuth)

    // remove cookie
//    removeCookie("accessToken")
    return true
  } catch (err) {
    console.error (err)
    return false
  }
}

const firebaseSignInWithEmailAndPassword = async (emailaddr, password) => {
  let redirectRequested = false // Set redirect flag

  try {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, emailaddr, password)

    if (userCredential.user.accessToken) {
      redirectRequested = true
    }
    return redirectRequested
  } catch (err) {
    console.error ("Error (srv: ", err)
    throw err
//    return redirectRequested
  }

  // Redirect
/*  if (redirectRequested) {
    redirect('/dashboard')
  } */
}


const listAllUsers = async (nextPageToken) => {
  try {
    const resp = await auth.listUsers(1000, nextPageToken)
    console.log("resp", resp.users)
  } catch (err) {
    console.error (err)
  }
}

export { listAllUsers, firebaseApp, db, firebaseAuth, vapidKey, firebaseSignInWithEmailAndPassword, logout } // auth messaging,