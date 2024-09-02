import { NextResponse } from 'next/server';
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

export const GET = async (request) => {
  const jwtClient = await getGoogleTokenFn()
  try {
    const tokens = await jwtClient.authorize()
    return NextResponse.json(
      {
        message: "Got new Google OAuth2 AccessToken",
        accessToken: tokens.access_token
      },
      {
        status: 200
      }
    )
  } catch (err) {
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

