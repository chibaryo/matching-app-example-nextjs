import { Storage } from '@google-cloud/storage'

import { decryptGCPServiceAccount } from '@/utils/decrypt/decrypt'
const serviceAccountJson = decryptGCPServiceAccount()

export const initStorage = () => {
  // Get bucket
  return new Storage({
    projectId: serviceAccountJson.project_id,
    credentials: {
      type: serviceAccountJson.type,
    project_id: serviceAccountJson.project_id,
    private_key_id: serviceAccountJson.private_key_id,
    private_key: serviceAccountJson.private_key,
    client_email: serviceAccountJson.client_email,
    client_id: serviceAccountJson.client_id,
    auth_uri: serviceAccountJson.auth_uri,
    token_uri: serviceAccountJson.token_uri,
    auth_provider_x509_cert_url: serviceAccountJson.auth_provider_x509_cert_url,
    client_x509_cert_url: serviceAccountJson.client_x509_cert_url
    }
  })
}
