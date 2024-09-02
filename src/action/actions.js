'use server'
import { cookies } from 'next/headers'

import { firebaseAuth } from '@/utils/firebase/firebaseinit'
import { createUserWithEmailAndPassword, signInAnonymously, signInWithEmailAndPassword, signOut } from 'firebase/auth'

import { redirect } from 'next/navigation'

export const navigate = async (pageUrl) => {
  redirect(pageUrl)
}

export const readFcmTokenFromCookie = async (props) => {
  return { fcmToken: cookies().get("fcmToken") }
}

export const createCookie = async (props) => {
  cookies().set({
    name: props.cname,
    value: props.value,
    httpOnly: true,
    path: '/',
    secure: false,
    maxAge: props.maxAge
  })
}

export const removeCookie = async (props) => {
  const cookieStore = cookies()
  if (cookieStore.getAll().length) {
    console.log("cookieStore.getAll()", cookieStore.getAll())
    cookies().delete(props.cname)
  }
}

export const doLogin = async (formData) => {
  let redirectRequested = false // Set redirect flag

  try {
    const emailaddr = formData.get('emailaddr')
    const password = formData.get('password')

    const userCredential = await signInWithEmailAndPassword(auth, emailaddr, password)
    if (userCredential.user.accessToken) {
      cookies().set({
        name: 'accessToken',
        value: userCredential.user.accessToken,
        httpOnly: true,
        path: '/',
        secure: false,
        maxAge: userCredential._tokenResponse.expiresIn
      })
      redirectRequested = true
    }
  } catch (err) {
    throw new Error(err)
  }

  // Redirect
  redirect('/dashboard')
}

/*
export const firebaseSignInWithEmailAndPassword = async (emailaddr, password) => {
  let redirectRequested = false // Set redirect flag

  try {
    const userCredential = await signInWithEmailAndPassword(auth, emailaddr, password)
    if (userCredential.user.accessToken) {
      cookies().set({
        name: 'accessToken',
        value: userCredential.user.accessToken,
        httpOnly: true,
        path: '/',
        secure: false,
        maxAge: userCredential._tokenResponse.expiresIn
      })
      redirectRequested = true
    }
  } catch (err) {
    throw new Error(err)
  }

  // Redirect
  redirect('/dashboard')
}
*/