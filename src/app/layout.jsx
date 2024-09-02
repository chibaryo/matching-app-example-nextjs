import "./globals.css";
//'use client'
//import { Inter } from "next/font/google";
//import { ChakraProvider } from '@chakra-ui/react'

//const inter = Inter({ subsets: ["latin"] });

// Context
import { AuthProvider } from '@/context/AuthContext'
import { FcmProvider } from "@/context/FcmContext";
import { ChakraProvider } from '@chakra-ui/react'

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
  VStack,
  IconButton,
} from '@chakra-ui/react'

import { MdBuild, MdCall } from "react-icons/md"
import { IoMdPerson } from "react-icons/io";
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png"></link>
        <meta name="theme-color" content="#f69435" />
      </head>
      <body>
        <ChakraProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}
