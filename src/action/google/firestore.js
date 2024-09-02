'use server'

import { decryptGCPServiceAccount } from '@/utils/decrypt/decrypt'
import { getApps, getApp, initializeApp } from 'firebase/app'
import { getFirestore, addDoc, collection, collectionGroup, getDocs, where, query, doc, serverTimestamp, get, getDoc, setDoc, updateDoc, orderBy, arrayUnion, arrayRemove, writeBatch, deleteDoc } from 'firebase/firestore'
const serviceAccountJson = decryptGCPServiceAccount()

import xlsx from 'node-xlsx'

// Firestore
import { db } from '@/utils/firebase/firebaseinit'

const defaultApp = getApps().length === 0 ? initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}) : getApp()

//const db = getFirestore(defaultApp)

const readFcmTokenByUid = async (uid) => {
  let _docid = ''
  let fcmTokensArray = []

  const usersRef = collection(db, "users")
  const q = query(usersRef, where("uid", '==', uid))
  const snapshot = await getDocs(q)

  snapshot.forEach((doc) => {
    _docid = doc.id
    fcmTokensArray = doc.data().currentFcmToken
  })
  console.log("fcmTokensArray: ", fcmTokensArray)

  return { _docid: _docid, fcmTokensArray: fcmTokensArray }
}

const getUserByUid = async (uid) => {
  const userRef = doc(db, "users", uid)
  const docSnap = await getDoc(userRef)

  if (docSnap.exists()) {
    return docSnap.data()
  } else {
    console.log("No such user")
  }
}

const readFromFirestore = async (collection_name) => {
  let posts = []
  const docsRef = collection(db, collection_name)
  const querySnapshot = await getDocs(query(docsRef, orderBy("createdAt", "desc")))
  querySnapshot.forEach((doc) => {
    posts.push({
      docId: doc.id,
      ...doc.data()
    })
  })

  return { posts: JSON.stringify(posts) }
}

const deletePostById = async (collection_name, id) => {
  const docRef = doc(db, collection_name, id)

  try {
    await deleteDoc(docRef)
  } catch (err) {
    console.error (err)
  }
}

const deletePostsByUid = async (collection_name, uid) => {
  try {
    const collectionRef = collection(db, collection_name)
    const collectionQuery = query(collectionRef, where("uid", "==", uid))
  
    const snapshot = await getDocs(collectionQuery)
  
    const batch = writeBatch(db)
  
    snapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })
  
    // Commit
    await batch.commit()
    console.log("UID related posts deleted.")
  } catch (err) {
    console.error (err)
  }
}


const batchAddisConfirmed = async (collection_name) => {
  const batch = writeBatch(db)

  const docsRef = collection(db, collection_name)
  const querySnapshot = await getDocs(query(docsRef))

  querySnapshot.forEach(async(postDoc) => {
    batch.set(
      doc(db, collection_name, postDoc.id),
      {
        isConfirmed: true
      },
      { merge: true }
    )
  })

  await batch.commit()
}

const batchAddNotiType = async (collection_name) => {
  const batch = writeBatch(db)

  const docsRef = collection(db, collection_name)
  const querySnapshot = await getDocs(query(docsRef))

  querySnapshot.forEach(async(postDoc) => {
    batch.set(
      doc(db, collection_name, postDoc.id),
      {
        notiType: "enquete"
      },
      { merge: true }
    )
  })

  await batch.commit()
}

const removePostsById = async (collection_name, id) => {
  const batch = writeBatch(db)

  const docsRef = collection(db, collection_name)
  const querySnapshot = await getDocs(query(docsRef, where("tagId", "==", id), orderBy("createdAt", "asc")))
  querySnapshot.forEach(async(item) => {
    const tagTidyRef = doc(db, "tagtidy", item.id)
    batch.delete(tagTidyRef)
  })

  await batch.commit()
}

const fetchRecordById = async (id, collection_name) => {
  const docRef = doc(db, collection_name, id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return docSnap.data()
  } else {
    console.log("No such document")
  }
}

const fetchTagsByIdArray = async (arr) => {
  const posts = await Promise.all(arr.map(async (item) => {
    const docRef = doc(db, "tags", item)
    const snap = await getDoc(docRef)
    return snap.data()
  }))

  return { posts: JSON.stringify(posts) }
}

const fetchTagtidyByUid = async (uid) => {
  let posts = []
  const docsRef = collection(db, "tagtidy")
  const querySnapshot = await getDocs(query(docsRef, where('firebaseUid', '==', uid), where('subscription_status', '==', true), orderBy("createdAt", "asc")))
  querySnapshot.forEach(async (doc) => {
    posts.push(doc.data())
  })

  return { posts: JSON.stringify(posts) }
}

export const updateFirestoreWithId = async (collection_name, payload, id) => {
  const docRef = doc(db, collection_name, id)
  try {
    await updateDoc(docRef, {...payload, updatedAt: serverTimestamp()})
    console.log("update success!")
    return { id: docRef.id }
  } catch (err) {
    console.error (err)
  }
}

export const postToFirestoreWithId = async (collection_name, payload) => {
  console.log("collection: ", collection_name)
  console.log("payload: ", payload)

  // send to db
  const docRef = doc(collection(db, collection_name))
  try {
    await setDoc(docRef, {...payload, id: docRef.id, createdAt: serverTimestamp(), modifiedAt: serverTimestamp()})
    console.log("docRef.id: ", docRef.id)
    return { id: docRef.id }
  } catch (err) {
    console.error (err)
  }
}

const postToFirestore = async (collection_name, payload) => {
  console.log("collection: ", collection_name)
  console.log("payload: ", payload)

  // send to db
  const docRef = doc(collection(db, collection_name))
  try {
    await setDoc(docRef, {...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp()})
    console.log("docRef.id: ", docRef.id)
    return { _docid: docRef.id }
  } catch (err) {
    console.error (err)
  }
}

const updateFirestoreFcmToken = async (collection_name, token, _docid) => {
  console.log("token : ", token)
  const userRef = doc(db, collection_name, _docid)
  await updateDoc(userRef, {
    currentFcmToken: arrayUnion(token)
  })
}

const updateTagExtIdWithArrayUnion = async (tags, uid) => {
  await Promise.all(tags.map(async (t) => {
    // Search document: tags.tagEngTitle == t
    const tagRef = collection(db, "tags")
    const q = query(tagRef, where("tagEngTitle", "==", t))
    const snapshot = await getDocs(q)

    snapshot.forEach(async (item) => {
      console.log("doc: ", item.id, '=>', item.data())
      const docRef = doc(db, "tags", item.id)
      try {
        await updateDoc(docRef, {
          external_uids: arrayUnion(uid)
        })
        console.log("Document updated successfully")
      } catch (err) {
        console.error("Error updating document: ", err)
      }
    })
  }))
}

const createTidy = async (uid) => {
    // First search tagId by tagname from "tags"
    const tmpRef = collection(db, "tags")
    const querySnapshot = await getDocs(query(tmpRef, orderBy("createdAt", "asc")))
    querySnapshot.forEach(async (item) => {
      // each tag
      const docRef = doc(collection(db, "tagtidy"))
      try {
        await setDoc(docRef, {firebaseUid: uid, tagId: item.id, subscription_status: false, _docid: docRef.id, createdAt: serverTimestamp(), modifiedAt: serverTimestamp()})
        console.log("docRef.id: ", docRef.id)
      } catch (err) {
        console.error (err)
      }
    })
}

const patchTagOn = async (tags, uid) => {
  // collection name: tagtidy
  // fields: "firebaseUid" | "tagId" | "subscription_status"
  //
  let tagIds_arr = []
  await Promise.all(tags.map(async (t) => {
    // First search tagId by tagname from "tags"
    const tmpRef = collection(db, "tags")
    let q = query(tmpRef, where("tagEngTitle", "==", t))
    let snapshot = await getDocs(q)
    snapshot.forEach(async (item) => {
      const { id } = item.data()
      tagIds_arr.push(id)
    })
  }))
  console.log("tagIds_arr", tagIds_arr)

  // Add "TRUE" on the tagtidy items which holds the correspondent tagId
  const tagRef = collection(db, "tagtidy")
  tagIds_arr.forEach(async (item) => {
    // Get single doc
    let q = query(tagRef, where("firebaseUid", "==", uid), where("tagId", "==", item))
    const snapshot_on = await getDocs(q)

    snapshot_on.forEach(async (item) => {
      console.log("item.id", item.id)
      const docRef = doc(db, "tagtidy", item.id)
      try {
        await updateDoc(docRef, {
          subscription_status: true
        })
      } catch (err) {
        console.error (err)
      }
    })

      // If checkbox not selected, set FALSE
      q = query(tagRef, where("firebaseUid", "==", uid), where("tagId", "!=", item))
      const snapshot_off = await getDocs(q)

      snapshot_off.forEach(async (item) => {
        console.log("debug: item.id: ", item.id)
        const docRef = doc(db, "tagtidy", item.id)
        try {
          await updateDoc(docRef, {
            subscription_status: false
          })
        } catch (err) {
          console.error (err)
        }
      })
    })
}

const patchTagOff = async (tags, uid) => {
}

const removeTagExtIdWithArrayUnion = async (tags, uid) => {
  await Promise.all(tags.map(async (t) => {
    // Search document: tags.tagEngTitle == t
    const tagRef = collection(db, "tags")
    const q = query(tagRef, where("tagEngTitle", "==", t))
    const snapshot = await getDocs(q)

    snapshot.forEach(async (item) => {
      console.log("doc: ", item.id, '=>', item.data())
      const docRef = doc(db, "tags", item.id)
      try {
        await updateDoc(docRef, {
          external_uids: arrayRemove(uid)
        })
        console.log("Removed uid from selected tags.")
      } catch (err) {
        console.error("Error updating document: ", err)
      }
    })
  }))
}

const findExtIdArrayByUid = async (uid) => {
  const tagRef = collection(db, "tags")
  const q = query(tagRef, where('external_uids', 'array-contains', uid))
  const snapshot = await getDocs(q)

  let arr = []
  snapshot.forEach(async (item) => {
    console.log("doc: ", item.id, '=>', item.data())
    arr.push({...item.data()})
  })
  console.log("arr", arr)

  return JSON.stringify(arr)
}

const uploadExcel = async (formData) => {
  const excel = formData.get('dropzone-file')
  const xlsxArray = new Uint8Array(await excel.arrayBuffer())

  // Load xlsx
  const workbook = xlsx.parse(xlsxArray)
  const tmp_arr = await Promise.all(workbook[0]["data"].map(async (elem) => ({
    tagEngTitle: elem[0],
    tagJapTitle: elem[1],
    selGenre: elem[2]
  })))
  tmp_arr.shift()

//  console.log("tmp_arr", tmp_arr)

  try {
    const batch = writeBatch(db)
    await Promise.all(tmp_arr.map(async (item) => {
      const docRef = doc(collection(db, "tags"))
      console.log("docRef.id: ", docRef.id)
      const payload = {
        id: docRef.id,
        tagEngTitle: item.tagEngTitle,
        tagJapTitle: item.tagJapTitle,
        selGenre: item.selGenre,
      }
      console.log("payload", payload)
      batch.set(docRef, {...payload, createdAt: serverTimestamp(), modifiedAt: serverTimestamp()})
    }))
/*    tmp_arr.forEach((item) => {
      const docRef = doc(collection(db, "tags"))
      console.log("docRef.id: ", docRef.id)
      const payload = {
        id: docRef.id,
        tagEngTitle: item.tagEngTitle,
        tagJapTitle: item.tagJapTitle,
        selGenre: item.selGenre,
      }
      batch.set(docRef, payload)
    }) */

    await batch.commit()

    return 
      {
        message: "Insert many success"
      }
  } catch (err) {
    return
      {
        error: err
      }
  }
}

export const getParentEngTitlesFromCurrentSubscriber = async (uid) => {
  const subscribers = query(
    collectionGroup(db, "subscribers"),
    where("uid", "==", uid)
  )
  
  const querySnapshot = await getDocs(subscribers)
  const tmp_arr = await Promise.all(querySnapshot.docs.map(async (subdoc) => {
    const parentDocId = subdoc.ref.parent.parent.id
    console.log("parentRef", parentDocId)
    const parentDocRef = doc(db, "tags", parentDocId)
    const snap = await getDoc(parentDocRef)
    return snap.data().tagEngTitle
  }))

  return tmp_arr
}

const batchUpdateJobLevel = async () => {
  try {
    // Initialize Firestore batch
    const batch = writeBatch(db)

    // Reference to the "users" collection
    const usersRef = collection(db, "users")

    // Query users with jobLevel as null or empty string
    const q = query(
      usersRef,
      where("jobLevel", "in", ["社員"]) // Query for jobLevel null or empty string
    )

    // Fetch documents matching the query
    const querySnapshot = await getDocs(q)

    // Iterate over each document and add update operation to the batch
    querySnapshot.forEach((docSnapshot) => {
      const userRef = doc(db, "users", docSnapshot.id)
      batch.update(userRef, { jobLevel: "一般" }) // Update jobLevel to "社員"
    })

    // Commit the batch
    await batch.commit()
    console.log("Batch update successful!")

  } catch (err) {
    console.error("Error updating documents: ", err)
  }
}

export { deletePostsByUid, batchUpdateJobLevel, getUserByUid, batchAddisConfirmed, fetchRecordById, removePostsById, deletePostById, fetchTagsByIdArray, fetchTagtidyByUid, createTidy, patchTagOn, findExtIdArrayByUid, updateTagExtIdWithArrayUnion, removeTagExtIdWithArrayUnion, updateFirestoreFcmToken, readFromFirestore, postToFirestore, readFcmTokenByUid, uploadExcel }
