'use server'
import { cookies } from 'next/headers'

import { decryptGCPServiceAccount } from '@/utils/decrypt/decrypt'
import { v4 } from 'uuid'

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app'
import { getMessaging } from "firebase-admin/messaging"
import { postToFirestore } from './firestore'
import { RiTreasureMapFill } from 'react-icons/ri'

const serviceAccountJson = decryptGCPServiceAccount()

export const fcmSendToTopic = async (payload) => {
  const defaultApp = getApps().length === 0 ? initializeApp({
    credential: cert({
      projectId: serviceAccountJson.project_id,
      clientEmail: serviceAccountJson.client_email,
      privateKey: serviceAccountJson.private_key
    })
  }) : getApp()

  const notificationId = v4()

  console.log("payloadd: ", payload)

  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      notificationId: notificationId,
      type: payload.type["value"],
/*      title: payload.title,
      body: payload.body,
      image: payload.image,
      url: payload.url, */
    },
    apns: {
      headers: {
        "apns-push-type": "alert",
        "apns-priority": "10"
      },
      payload: {
        aps: {
          contentAvailable: true,
          alert: {
            title: payload.title,
            body: payload.body,
          },
          //badge: 82,
          sound: "default"
        }
      }
    },
    webpush: {
      fcmOptions: {
      //  link: payload.url,
      },
/*      headers: {
        image: payload.image
      } */
    },
    topic: payload.topic
  }
  console.log("message: ", message)

  try
  {
    const resp = await getMessaging().send(message)

    // After successful send, post to Firestore
    const notiPayload = {
      notiTitle: payload.title,
      notiBody: payload.body,
      notiTopic: payload.topic,
      notiType: payload.type["value"],
      notificationId: notificationId,
    }

    console.log("notiPayload: ", notiPayload)
    const retFirestore = await postToFirestore("notifications", notiPayload)

    console.log(`Message sent to topic ${payload.topic} successfully.`, resp)
  } catch (err) {
    console.error(err)
  }
}
