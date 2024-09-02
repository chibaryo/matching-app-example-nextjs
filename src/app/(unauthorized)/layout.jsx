// Header, Footer
//import SiteHeader from "@/components/common/siteheader"
//import SiteFooter from "@/components/common/sitefooter"

export default function Layout({ children }) {
  return (
    <div className="w-full flex flex-col my-0 h-[100svh]">
      <main className="flex-1 overflow-y-scroll hidden-scrollbar">
        {children}
      </main>
    </div>
  )
}
