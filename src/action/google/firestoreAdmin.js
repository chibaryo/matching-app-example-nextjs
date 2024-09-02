'use server'
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app'
import { getFirestore } from "firebase-admin/firestore"

import { decryptGCPServiceAccount } from '@/utils/decrypt/decrypt'

const serviceAccountJson = decryptGCPServiceAccount()

// Initialize Firebase Admin SDK
const defaultApp = getApps().length === 0 ? initializeApp({
  credential: cert({
    projectId: serviceAccountJson.project_id,
    clientEmail: serviceAccountJson.client_email,
    privateKey: serviceAccountJson.private_key
  })
}) : getApp()

const db = getFirestore()

export const deleteCollection = async (collectionPath, batchSize) => {
    const collectionRef = db.collection(collectionPath)
    const query = collectionRef.orderBy('__name__').limit(batchSize)
  
    return new Promise((resolve, reject) => {
      deleteQueryBatch(query, resolve).catch(reject)
    })
}

const deleteQueryBatch = async (query, resolve) => {
    const snapshot = await query.get()
  
    const batchSize = snapshot.size
    if (batchSize === 0) {
      // When there are no documents left, we are done
      resolve()
      return
    }
  
    // Delete documents in a batch
    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
  
    await batch.commit()
  
    // Recurse on the next process tick, to avoid exploding the stack.
    process.nextTick(() => {
      deleteQueryBatch(query, resolve)
    })
}
