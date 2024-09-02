"use client"

import { useRef, createContext, useEffect, useState, useContext } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { firebaseApp, firebaseAuth } from '@/utils/firebase/firebaseinit'
//import { genSignedImageUrl } from '@/action/google/cloudstorage'

const AuthContext = createContext({ currentUser: undefined, token: null })

// server actions
import { createCookie } from '@/action/actions'

export const useAuthContext = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(undefined)
  const [token, setToken] = useState(null)
  const running = useRef(true)

  useEffect(() => {
    (async () => {

      if(process.env.NODE_ENV == 'development')
      {
        if (running.current) {
          running.current = false
          return
        }
      }

      const auth = getAuth(firebaseApp)
      return onAuthStateChanged(auth, async (currentUser) => {
        console.log("fofdgderfo!")
        if (currentUser) {
          setCurrentUser(currentUser)          
          console.log("user logged in as (currentUser): ", currentUser)
          // Set token
          const token = await currentUser.getIdToken()
          createCookie({
            cname: "accessToken",
            value: token,
            maxAge: currentUser.stsTokenManager.expirationTime
          })
          setToken(token)
        } else {
          setCurrentUser(null)
          setToken(null)
        }
      })
    })()
  }, [])

  return <AuthContext.Provider value={{ currentUser: currentUser, token: token }}>{children}</AuthContext.Provider>
}
