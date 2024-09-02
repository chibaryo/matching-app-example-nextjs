'use client'
import React, { useRef, useEffect, useState, FormEvent } from 'react'

import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, updateProfile, updateEmail } from 'firebase/auth'
import { firebaseApp, firebaseAuth, db } from '@/utils/firebase/firebaseinit'
import { useRouter } from 'next/navigation'
import { getMessaging, deleteToken } from 'firebase/messaging'
import { FieldValue, collectionGroup, collection, doc, query, where, deleteDoc, getDoc, getDocs, updateDoc, orderBy } from 'firebase/firestore'
import { fcmUnSubscribeFromTopic } from '@/action/google/unSubscribeFromTopic'
import { getParentEngTitlesFromCurrentSubscriber } from '@/action/google/firestore'
import { uploadImage } from '@/action/google/cloudstorage'

// Context
import { useAuthContext } from '@/context/AuthContext'
import { useFcmToken } from '@/hooks/fcmToken/useFcmToken'
import { useToast } from '@chakra-ui/react'

const AccountAdmin = () => {
  const running = useRef(true)
  const router = useRouter()
  const toast = useToast()

  const { currentUser, token } = useAuthContext()
  const { fcmToken, notificationPermissionStatus } = useFcmToken()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [uploadFile, setUploadFile] = useState(null)

  useEffect(() => {
    (async () => {
      if (process.env.NODE_ENV == 'development') {
        if (running.current) {
          running.current = false
          return
        }
      }

    })()
  }, [])

  const removeuserFromTagSubcollection = async (tagEngTitle) => {
    const collectionRef = collection(db, "tags")
    let q = query(collectionRef, where('tagEngTitle', "==", tagEngTitle))
    const snapshot_on = await getDocs(q)

    // Get Userref
    const userRef = doc(db, "users", currentUser.uid)
    // 
    snapshot_on.forEach(async (item) => {
      const docRef = doc(db, "tags", item.id, "subscribers", currentUser.uid)
      console.log("item.id", item.id)
      try {
        await deleteDoc(docRef)
      } catch (err) {
        console.error(err)
      }
    })
  }

  const handleSignOutClick = async () => {
    console.log("currentUser", currentUser.uid)
    await firebaseAuth.signOut()
    toast({
      title: "サインアウトしました",
      position: "bottom",
      status: "success",
    })
    if (currentUser?.email == null) {
      // Delete Firestore data from 'tags'
      let subscribed_tags = await getParentEngTitlesFromCurrentSubscriber(currentUser?.uid)

      if (subscribed_tags.length > 0) {
        subscribed_tags.forEach(async (i) => {
          removeuserFromTagSubcollection(i)
        })
      }

      // Delete Firestore data from 'users'
      try {
        const userRef = doc(db, "users", currentUser?.uid)
        await deleteDoc(userRef)
      } catch (err) {
        console.error(err)
      }

      // Delete Firebase Account
      await currentUser?.delete()
      toast({
        title: "匿名アカウントを削除しました",
        position: "bottom",
        status: "info",
      })
      }

    // Remove old fcmToken in "users"
    /*const messaging = getMessaging(firebaseApp)
    await deleteToken(messaging)
    toast({
      title: "トークンを削除しました",
      position: "bottom",
      status: "info",
    }) */

    // Unsubscribe from "notice_all"
    try {
      const res = await fcmUnSubscribeFromTopic(fcmToken, "notice_all")
      console.log("unsubscribe: ", res)
    } catch (err) {
      console.error(err)
    }

    router.push("/")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (displayName.length > 0) {
      console.log("displayName", displayName)
      // Update displayName
      await updateProfile(firebaseAuth.currentUser, { displayName: displayName })
      const userRef = doc(db, "users", currentUser?.uid)
      try {
        await updateDoc(userRef, {
          displayName: displayName
        })
      } catch (err) {
        console.error(err)
      }


    }

    /* Update photoUrl */
    // conv image
    let imgArray = Buffer.from(new Uint8Array(await uploadFile.arrayBuffer()))
    const base64data = btoa([...imgArray].map(n => String.fromCharCode(n)).join(""))
    const imagepath = await uploadImage({data: base64data, dirPrefix: "images", name: uploadFile.name, type: uploadFile.type})
    console.log("imagepath", imagepath)
    await updateProfile(firebaseAuth.currentUser, { photoURL: imagepath[0] })

    {
      const userRef = doc(db, "users", currentUser?.uid)
      try {
        await updateDoc(userRef, {
          photoURL: imagepath[0]
        })
      } catch (err) {
        console.error(err)
      }
    }

    /*    if (email.includes("@")) {
          const passwordRef = doc(db, "users", currentUser?.uid)
          try {
            const docSnap = await getDoc(passwordRef)
            const pwdata = docSnap.data()
            console.log("pwdata", pwdata.password)
    
            await signInWithEmailAndPassword(firebaseAuth, currentUser?.email, pwdata.password)
            await updateEmail(firebaseAuth.currentUser, email)
            } catch (err) {
            console.error (err)
          } */
    /*
          console.log("currentUser?.email: ", currentUser?.email)
          console.log("email: ", email)
          console.log("email chigau")
          await signInWithEmailAndPassword(firebaseAuth, currentUser?.email, password)
          await updateEmail(firebaseAuth.currentUser, { newEmail: email })
    
          const userRef = doc(db, "users", currentUser?.uid)
          try {
            await updateDoc(userRef, {
              email: email
            })
          } catch (err) {
            console.error (err)
          }  
        }*/

  }

  return (
    <>
    <div className='flex flex-row gap-4 mx-12 my-12 place-content-between'>
      <div>
      <button
        type="button"
        className="bg-red-200 px-5 py-3 text-sm shadow-sm font-medium tracking-wider  text-red-600 rounded-full hover:shadow-2xl hover:bg-red-300"
        onClick={() => getParentEngTitlesFromCurrentSubscriber(currentUser.uid)}
      >Test</button>
    </div>
    <div>
      <button
        type="button"
        className="bg-red-200 px-5 py-3 text-sm shadow-sm font-medium tracking-wider  text-red-600 rounded-full hover:shadow-2xl hover:bg-red-300"
        onClick={() => handleSignOutClick()}
      >
        サインアウト
      </button>
    </div>
    </div>

      {/* Account info */}
      <section className='w-full mx-12'>
        <form onSubmit={(e) => handleSubmit(e)}>
          <div className='mx-4 my-4 flex items-center place-content-center'>
            <img
              className='w-48 h-48 rounded-full'
              src={currentUser?.photoURL}
              alt=""
            />
          </div>
          <div className='flex flex-col my-2 px-2 py-2'>
            <span className='inline-block'>
              名前
            </span>
            <span className='inline-block border-b mx-2 px-3 py-2'>
              <input
                type="text"
                name="displayName"
                defaultValue={currentUser?.displayName || ''}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </span>
          </div>
          <div className='flex flex-col my-2 px-2 py-2'>
            <span className='inline-block'>
              メールアドレス
            </span>
            <span className='inline-block border-b mx-2 px-3 py-2'>
              <input
                type="email"
                name="email"
                defaultValue={currentUser?.email || ''}
                onChange={(e) => setEmail(e.target.value)}
              />
            </span>
          </div>
          <div className='mb-4'>
            <label htmlFor='reviewPictures' className='block text-gray-700 text-sm font-bold mb-2'>画像
              <input
                type="file"
                name="画像"
                className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                placeholder="画像"
                accept='.jpg, .png'
                multiple
                onChange={(e) => setUploadFile(e.target.files[0])}
              />
            </label>
          </div>

          <button
            type="submit"
            className="bg-blue-400 px-5 py-3 text-sm shadow-sm font-medium tracking-wider  text-blue-100 rounded-full hover:shadow-2xl hover:bg-blue-500"
          >保存</button>
        </form>
      </section>
    </>
  )
}

export default AccountAdmin