'use server'

import { decryptGCPServiceAccount } from '@/utils/decrypt/decrypt'
import { v4 } from 'uuid'

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app'
import { getMessaging } from "firebase-admin/messaging"
import { postToFirestore } from './firestore'

const serviceAccountJson = decryptGCPServiceAccount()

export const sendSilentPush = async (payload) => {
  const defaultApp = getApps().length === 0 ? initializeApp({
    credential: cert({
      projectId: serviceAccountJson.project_id,
      clientEmail: serviceAccountJson.client_email,
      privateKey: serviceAccountJson.private_key
    })
  }) : getApp()

  const notificationId = v4()

  console.log("payload: ", payload)

  const message = {
    apns: {
        headers: {
            "apns-push-type": "alert",
            "apns-priority": "5"
        },
        payload: {
            aps: {
                //contentAvailable: true,
                badge: 81,
                //sound: "default",
            }
        }
    },
    data: {
        hoge: "fuga"
    },
    //token: "fziIxB9JlUEWgIN-fOG77x:APA91bHeUvfJSCLclqC2gqPp8G66VKjllbA6RMx5CPDsw6SrfU7M11nuSsaBwP5FlnZ9URvY0Hme9Fg8wZC9I3o4Kh5lLK6SI1vAvRaRnVblFsokhyXEEibHOASF_8zUEWEdB5kcB-yX"
    topic: "notice_all"
  }
  console.log("message: ", message)

  try
  {
    const resp = await getMessaging().send(message)

    console.log("Silent push sent.")
  } catch (err) {
    console.error(err)
  }
}
