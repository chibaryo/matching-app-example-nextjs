'use server'
import { google } from 'googleapis'
import { v4 } from 'uuid'

import { initStorage } from './initStorage'

const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET


export const uploadImage = async ({data: base64data, dirPrefix: dirPrefix, name: fname, type: ftype}) => {
  const storage = initStorage()
  const bucket = storage.bucket(bucketName)
  const dirName =  "images" //v4()
  const blob = bucket.file(`${dirPrefix}/${dirName}/${fname}`) 
  const saveOptions = {
    contentType: ftype
  }

  // Upload file to GCS
  try {
    await blob.save(Buffer.from(base64data, 'base64'), saveOptions)

    const imagepath = `https://storage.cloud.google.com/${bucketName}/${dirPrefix}/${dirName}/${fname}`
    console.log("imagepath: ", imagepath)

    const getSignedUrlOptions = {
      action: "read",
      expires: Date.now() + 1000 * 60 * 60, // One hour
    }

    const [url] = await blob.getSignedUrl(getSignedUrlOptions)
    return [url]
  
  } catch (err) {
    console.error(err)
  }
}

export const genSignedImageUrl = async (dirPrefix, imagepath) => {
  const storage = initStorage()
  console.log("begin gensigned...")
  console.log("imagepath: ", imagepath)

  const imageUrl = new URL(imagepath)
  const path = imageUrl.pathname.split('/')

  const bucketName = path[1]
//  const dirPrefix = "facility"
  const dirName = path[3]
  const fileName = path[4]

  const bucket = storage.bucket(bucketName)
  const getSignedUrlOptions = {
    action: "read",
    expires: Date.now() + 1000 * 60 * 60, // One hour
  }
  const [url] = await bucket.file(`${dirPrefix}/${dirName}/${fileName}`).getSignedUrl(getSignedUrlOptions)
/*  const imgblob = bucket.file(`${dirPrefix}/${dirName}/${fileName}`)
  const [url] = await imgblob.getSignedUrl(getSignedUrlOptions) */

  return [url]
}
