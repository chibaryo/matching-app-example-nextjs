'use server'
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app'
import { getAuth } from "firebase-admin/auth"

import { decryptGCPServiceAccount } from '@/utils/decrypt/decrypt'

const serviceAccountJson = decryptGCPServiceAccount()

export const deleteFirebaseAuthUser = async (uid) => {
  const defaultApp = getApps().length === 0 ? initializeApp({
    credential: cert({
      projectId: serviceAccountJson.project_id,
      clientEmail: serviceAccountJson.client_email,
      privateKey: serviceAccountJson.private_key
    })
  }) : getApp()

  try {
    const result = getAuth().deleteUser(uid)
    console.log("uid: ", uid)
  } catch (err) {
    console.error(err)
  }
}

export const getUserByEmail = async (email) => {
  const defaultApp = getApps().length === 0 ? initializeApp({
    credential: cert({
      projectId: serviceAccountJson.project_id,
      clientEmail: serviceAccountJson.client_email,
      privateKey: serviceAccountJson.private_key
    })
  }) : getApp()

  try {
    const userRecord = await getAuth().getUserByEmail(email)
    return userRecord
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      return null
    }
    throw err
  }
}

export const createFirebaseAuthUser = async (payload) => {
  const defaultApp = getApps().length === 0 ? initializeApp({
    credential: cert({
      projectId: serviceAccountJson.project_id,
      clientEmail: serviceAccountJson.client_email,
      privateKey: serviceAccountJson.private_key
    })
  }) : getApp()

  try {
    console.log("displayName", payload["displayName"])
    const userRecord = await getAuth().createUser({
      email: payload["email"],
      emailVerified: false,
      password: payload["password"],
      displayName: payload["displayName"],
      disabled: false
    })
    console.log("added uid: ", userRecord["uid"])
    return userRecord["uid"]
  } catch (err) {
    console.error(err)
    throw err
  }
}

export const updateFirebaseAuthUser = async (uid, payload) => {
  const defaultApp = getApps().length === 0 ? initializeApp({
    credential: cert({
      projectId: serviceAccountJson.project_id,
      clientEmail: serviceAccountJson.client_email,
      privateKey: serviceAccountJson.private_key
    })
  }) : getApp()

  try {
    console.log("displayName", payload["displayName"])
    const userRecord = await getAuth().updateUser(uid, {
      email: payload["email"],
//      emailVerified: false,
      password: payload["password"],
      displayName: payload["displayName"],
      disabled: false
    })
    console.log("updated uid: ", userRecord["uid"])
    return userRecord["uid"]
  } catch (err) {
    console.error(err)
  }
}
