"use client"

import { useRef, createContext, useEffect, useState, useContext } from 'react'
import { getMessaging, getToken } from 'firebase/messaging'
import { firebaseApp, firebaseAuth, vapidKey } from '@/utils/firebase/firebaseinit'

// server actions
import { createCookie } from '@/action/actions'

const FcmContext = createContext({ fcmToken: undefined })

export const useFcmContext = () => {
  return useContext(FcmContext)
}

export const FcmProvider = ({ children }) => {
  const running = useRef(true)
  const [fcmToken, setFcmToken] = useState(null)

  useEffect(() => {
    (async () => {
      if(process.env.NODE_ENV == 'development')
      {
        if (running.current) {
          running.current = false
          return
        }
      }

      const permission = await Notification.requestPermission
      if (permission == "granted") {
        try {
          console.log("trying to retrieve fcmToken...")
          const messaging = getMessaging(firebaseApp)
          const resultToken = await getToken(messaging, vapidKey)
          setFcmToken(resultToken)

        } catch (err) {
          console.error (err)
        }
      }

    })()
  }, [])

  return <FcmContext.Provider value={{ fcmToken: fcmToken }}>{children}</FcmContext.Provider>
}
