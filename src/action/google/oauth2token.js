'use server'
import { cookies } from 'next/headers'

import { google } from 'googleapis'
import { decryptGCPServiceAccount } from '@/utils/decrypt/decrypt'

const getGoogleTokenFn = async () => {
  // Load serviceAccount json
  const serviceAccountJson = decryptGCPServiceAccount()

  const jwtClient = new google.auth.JWT(
    serviceAccountJson.client_email,
    null,
    serviceAccountJson.private_key,
    [
      'https://www.googleapis.com/auth/firebase.messaging', 
    ],
    null
  )

  return jwtClient
}

export const getGoogleOAuth2Token = async (props) => {
  try {
    const jwtClient = await getGoogleTokenFn()
    const tokens = await jwtClient.authorize()

    console.log("tokens: (server side)", tokens)
    return {tokeninfo: JSON.stringify(tokens)}
  } catch (err) {
    console.error (err)
  }

}
