import { NextResponse } from 'next/server';
import { google } from 'googleapis'
import { decryptGCPServiceAccount } from '@/utils/decrypt/decrypt'
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app'
import { getMessaging } from "firebase-admin/messaging"

// server actions
import { postToFirestore } from '@/action/google/firestore';

const serviceAccountJson = decryptGCPServiceAccount()

export const POST = async (request) => {
  const body = await request.json()

  const defaultApp = getApps().length === 0 ? initializeApp({
    credential: cert({
      projectId: serviceAccountJson.project_id,
      clientEmail: serviceAccountJson.client_email,
      privateKey: serviceAccountJson.private_key
    })
  }) : getApp()

  console.log("body: ", body)

  const message = {
    notification: {
      title: body.title,
      body: body.body,
//      image: body.image,
//      url: body.url,
    },
/*    data: {
      notificationId: body.notificationId,
      type: body.type
    },*/
    webpush: {
      fcmOptions: {
      //  link: payload.url,
      },
/*      headers: {
        image: payload.image
      } */
    },
    token: body.token
  }
  console.log("message: ", message)

  try
  {
    const resp = await getMessaging().send(message)

    return NextResponse.json(
      {
        message: "Message sent.",
      },
      {
        status: 200
      }
    )
  } catch (err) {
    console.log("sending message to topic error:", err)

    return NextResponse.json(
      {
        message: "Internal Server Error: " + err,
      },
      {
        status: 500
      }
    )
  }
}
