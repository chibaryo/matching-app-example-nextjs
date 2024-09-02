'use client'

import Link from 'next/link'
import React, { useRef, useEffect, useState, FormEvent } from 'react'
//import Image from "next/image";
//import styles from "./page.module.css";
import { useFcmToken } from '@/hooks/fcmToken/useFcmToken'
import { getGoogleOAuth2Token } from '@/action/google/oauth2token'
import { createCookie, readFcmTokenFromCookie } from '@/action/actions'
import { fcmSubscribeToTopic } from '@/action/google/subscribeToTopic'

// Chakra UI
import {
  Box,
  Button,
  Stack,
  Text,
  ButtonGroup,
  Center,
  Flex,
  Heading,
  Container,
  IconButton,
  CircularProgress,
  CircularProgressLabel
} from '@chakra-ui/react'

import { MdBuild, MdCall } from "react-icons/md"
import { IoMdPerson } from "react-icons/io";
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa'

const MenuItems = ({ children }) => (
  <Text mt={{ base: 4, md: 0 }} mr={6} display="block">
    {children}
  </Text>
);

const Home = () => {
  const running = useRef(true)
  const { fcmToken, notificationPermissionStatus } = useFcmToken()
  const [show, setShow] = React.useState(false);
  const handleToggle = () => setShow(!show);

  const [ isInstallable, setIsInstallable ] = useState(false)
  const [ deferredPrompt, setDeferredPrompt ] = useState(null)
  const message = "ホーム画面に追加"
  const disabledMessage = "ホーム画面に追加済み"

  //
  const deferredPromptRef = useRef(null);
  const [ready, setReady] = useState(false);
  // iOS
  const [isiOs, setIsiOS ] = useState(false)

  useEffect(() => {
    (async () => {
      if (process.env.NODE_ENV == 'development') {
        if (running.current) {
          running.current = false
          return
        }
      }

      const result = await getGoogleOAuth2Token()
      console.log("resdata: ", JSON.parse(result.tokeninfo))
      await createCookie({
        cname: "googleAccessToken",
        value: JSON.parse(result.tokeninfo).access_token,
        maxAge: JSON.parse(result.tokeninfo).expiry_date,
      })

      // A2HS
      const beforeInstallPromptHandler = () => {
        setReady(true);
        deferredPromptRef.current = event;
      }
      // isIos
      const isIos = () => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test( userAgent );
      }

      // Detects if device is in standalone mode
      const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);
      if (isIos() && !isInStandaloneMode()) {
        setIsiOS(true)
      }

      window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

      return () => {
        window.removeEventListener(
          'beforeinstallprompt',
          beforeInstallPromptHandler
        );
      }

    })()
  }, [])

  const handleClickInstall = async () => {
    const deferredPrompt = deferredPromptRef.current;
    if (deferredPrompt) {
      // Show install prompt
      deferredPrompt.prompt();
    }
  }

  const onInstallClick = async () => {
    if (!deferredPrompt) {
      console.log("boo!")
      return
    }

    console.log("poo!")
    deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome == "accepted") {
      setDeferredPrompt(null)
      setIsInstallable(false)
    } else {
      setIsInstallable(true)
    }
  }

  return (
    <>
      <Stack direction='row' spacing={4}>
      <Button leftIcon={<IoMdPerson />} colorScheme='teal' variant='solid' mx="4" my="4">
          <Link
            href="/login"
          >
            ログイン
          </Link>
        </Button>
{/*
        <Button leftIcon={<IoMdPerson />} colorScheme='teal' variant='solid' mx="4" my="4">
          <Link
            href="/signup"
          >
            サインアップページへ
          </Link>
        </Button>

        <button
          type="button"
          id="a2hs_btn"
          onClick={handleClickInstall}
//          disabled={!isInstallable}
          className='text-white bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 hover:bg-gradient-to-br focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg text-md px-5 py-2.5 text-center mr-2 mb-2'
        >
        {isiOs ? "iOS! installable" : "Android"}
        </button>*/}
      </Stack>
    </>
  )
}

export default Home