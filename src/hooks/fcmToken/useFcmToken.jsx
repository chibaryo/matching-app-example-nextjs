'use client'

import { useRef, useEffect, useState } from 'react'
import { getMessaging, getToken } from 'firebase/messaging'
import { firebaseApp } from '@/utils/firebase/firebaseinit'

import { createCookie } from '@/action/actions'

export const useFcmToken = () => {
  const running = useRef(true)

  const [ token, setToken ] = useState('')
  const [ notificationPermissionStatus, setNotificationPermissionStatus ] = useState('')

  const retrieveToken = async () => {
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const sw = await window.navigator.serviceWorker.register('/firebase-messaging-sw.js')
        const messaging = getMessaging(firebaseApp)

        // Retrieve the notification permission status
        const permission = await Notification.requestPermission()
        setNotificationPermissionStatus(permission)

        // Check if permission is granted before retrieving the token
        if (permission === 'granted') {
          const currentToken = await getToken(messaging, {
            vapidKey:
              process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_VAPID_KEY,
          })
          if (currentToken) {
            setToken(currentToken)
            console.log("currentToken: ", currentToken)
            await createCookie({
              cname: "fcmToken",
              value: currentToken,
              maxAge: 65536
            })
      
          } else {
            console.log(
              'No registration token available. Request permission to generate one.'
            )
          }
        }
      }
    } catch (err) {
      console.error('An error occurred while retrieving token:', err)
    }
  }

  useEffect(() => {
    (async () => {
      if(process.env.NODE_ENV == 'development')
      {
        if (running.current) {
          running.current = false
          return
        }
      }
  
      await retrieveToken()

      return () => {
      }
    })()
  }, [])

  return { fcmToken: token, notificationPermissionStatus }
}
