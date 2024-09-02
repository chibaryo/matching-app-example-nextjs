'use server'
import { cookies } from 'next/headers'

import { decryptGCPServiceAccount } from '@/utils/decrypt/decrypt'

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app'
import { getMessaging } from "firebase-admin/messaging"

const serviceAccountJson = decryptGCPServiceAccount()

export const fcmSubscribeToTopic = async (token, topic) => {
  const defaultApp = getApps().length === 0 ? initializeApp({
    credential: cert({
      projectId: serviceAccountJson.project_id,
      clientEmail: serviceAccountJson.client_email,
      privateKey: serviceAccountJson.private_key
    })
  }) : getApp()

  try
  {
    const resp = await getMessaging().subscribeToTopic(token, topic)
    console.log("subscribed successfully.", resp)
  } catch (err) {
    console.error(err)
  }
}
