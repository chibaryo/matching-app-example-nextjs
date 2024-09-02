'use client'
import NextLink from 'next/link'
import React, { useRef, useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { onAuthStateChanged } from 'firebase/auth'
import {
  firebaseAuth,
  firebaseSignInWithEmailAndPassword,
  logout
} from '@/utils/firebase/firebaseinit'

import { getUserByUid } from '@/action/google/firestore'

import {
    Box,
    Button,
    Drawer,
    DrawerOverlay,
    DrawerCloseButton,
    DrawerHeader,
    DrawerBody,
    DrawerContent,
    VStack,
  } from '@chakra-ui/react'
  

  const SidebarContent = ({ onClick, handleSignOut, jobLevel }) => (
    <VStack>
      {/*
      <Button as={NextLink} href="/designtest/tag" w="100%">
        タグ
      </Button>
       */}
      {/* 管理メニュー */}
        <>
          {(jobLevel === "管理者") && (
            <>
          <Button as={NextLink} href="/admin/template" w="100%" onClick={onClick}>
            テンプレート
          </Button>
          </>
          )}
          {(jobLevel === "管理者" || jobLevel === "責任者") && (
            <>
          <Button as={NextLink} href="/admin/user" w="100%" onClick={onClick}>
            ユーザ
          </Button>
          <Button as={NextLink} href="/admin/noti" w="100%" onClick={onClick}>
            通知
          </Button>
          </>
        )}
        </>

      {/* 一般メニュー */}
        <Button
          type="button"
          w="100%"
          marginTop='4'
          color='white'
          bg='purple.400'
          paddingX='auto'
          onClick={handleSignOut}
        >
          サインアウト
        </Button>
    </VStack>
  )
  
  const Sidebar = ({ isOpen, variant, onClose }) => {
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
      const res = await logout
      if (res) {
          console.log("goto signin")
          router.replace('/signin')
      }
    }

    return variant === 'sidebar' && loginUser ? (
      <Box
        position="fixed"
        left={0}
        p={5}
        w="200px"
        top={0}
        h="100%"
        bg="#dfdfdf"
      >
        <SidebarContent
          onClick={onClose}
          handleSignOut={handleSignOut}
          jobLevel={loginUser.jobLevel}
        />
      </Box>
    ) : (
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay>
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>サイドメニュー</DrawerHeader>
            <DrawerBody>
              <SidebarContent onClick={onClose} />
            </DrawerBody>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>
    )
  }
  
  export default Sidebar
  