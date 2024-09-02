'use client'

// Header, Footer
import SiteHeader from "@/components/common/siteheader"
import SiteFooter from "@/components/common/sitefooter"
import AdminSidebar from "@/components/common/adminsidebar"
import AdminAppbar from "@/components/common/AdminAppbar"
import { ThemeProvider } from '@/context/ThemeContext'

import React, { useRef, useEffect, useState, useContext, useMemo } from "react";

import ChakraHeader from "@/components/common/ChakraHeader"
import ChakraSideBar from "@/components/common/ChakraSideBar"
const smVariant = { navigation: 'drawer', navigationButton: true }
const mdVariant = { navigation: 'sidebar', navigationButton: false }
// ChakraUI
import {
  Flex,
  Divider,
  Center,
  Spacer,
  Box,
  useBreakpointValue
} from '@chakra-ui/react'

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const variants = useBreakpointValue({ base: smVariant, md: mdVariant })

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen)

  return (
    <ThemeProvider>
        <ChakraSideBar
          variant={variants?.navigation}
          isOpen={isSidebarOpen}
          onClose={toggleSidebar}
        />
        <Box ml={!variants?.navigationButton && 200}>
          <ChakraHeader
            showSidebarButton={variants?.navigationButton}
            onShowSidebar={toggleSidebar}
          />
            {children}
        </Box>
    </ThemeProvider>
  )

}

export default Layout
