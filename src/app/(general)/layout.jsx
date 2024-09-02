// Header, Footer
import SiteHeader from "@/components/common/siteheader"
import SiteFooter from "@/components/common/sitefooter"
import AdminSidebar from "@/components/common/adminsidebar"
import AdminAppbar from "@/components/common/AdminAppbar"
import { ThemeProvider } from '@/context/ThemeContext'

export default function Layout({ children }) {
  const openSidebar = () => {

  }

  return (
    <ThemeProvider>
    <div className={`flex w-screen h-screen`}>
      <div className='flex flex-col w-full'>
        <div className='justify-center items-center flex-1 overflow-y-scroll'>
          {children}
        </div>
      </div>
    </div>
  </ThemeProvider>
  )
}
