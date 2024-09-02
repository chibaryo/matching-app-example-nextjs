'use client'

import React, { useRef, useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'

import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  Text,
  Box,
} from '@chakra-ui/react'

import { firebaseAuth, logout } from "@/utils/firebase/firebaseinit";

// server actions
import { batchUpdateJobLevel, getUserByUid } from '@/action/google/firestore'

const Dashboard = () => {
  const running = useRef(true)
  const router = useRouter()

  // User info
  const [ loginUser, setLoginUser ] = useState(null)

  useEffect(() => {
    (async () => {
      if(process.env.NODE_ENV == 'development')
      {
        if (running.current) {
          running.current = false
          return
        }
      }

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        console.log('User Uid: ', user.uid)
        console.log('User email: ', user.email)
        // Get user info from Firestore
        const resUser = await getUserByUid(user.uid)
        console.log("user info: ", resUser)

        // Ensure resUser is a plain object
        if (resUser && typeof resUser === 'object') {
          setLoginUser({
            name: resUser.name,
            email: resUser.email,
            uid: resUser.uid,
            isAdmin: resUser.isAdmin,
            officeLocation: resUser.officeLocation,
            jobLevel: resUser.jobLevel,
            department: resUser.department,
          })
        }
 
      } else {
        console.log("No user is signed in.")
        router.replace("/signin")
      }
      })
    })()
  }, [router])

  const handleSignOut = async () => {
/*    await logout()
    router.push("/login") */
    const res = await logout
    if (res) {
        console.log("goto signin")
        router.replace('/signin')
    }
  }

  const batchupdjoblevel = async () => {
    await batchUpdateJobLevel()
  }

  return (
    <>
      <VStack>
        {loginUser ? (
          <>
            <Text>You are logged in as: {loginUser.name}</Text>
            <Box>
              <Text>UID: {loginUser.uid}</Text>
              <Text>名前: {loginUser.name}</Text>
              <Text>メールアドレス: {loginUser.email}</Text>
            </Box>
          </>
        ): (
          <Text>Loading user info...</Text>
        )}
      </VStack>
    </>
  )
}

export default Dashboard