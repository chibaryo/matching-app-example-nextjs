'use client'
import React, { useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";
import { useThemeContext } from "@/context/ThemeContext";

//const userProfileImage = "https://storage.googleapis.com/prefs-834f0.appspot.com/profile_images/44120686-ba55-4582-bb7d-71ad1a293160/122124.jpg?GoogleAccessId=firebase-adminsdk-pjbpp%40prefs-834f0.iam.gserviceaccount.com&Expires=1706441307&Signature=jZ8h2GQJH2oYOKfBLN0Qfl%2FmiV6uhPvJBa2TGpYW37bJG63jjpMiASZi3FeQC4UG5hAahTQ9K456gBdX12W5J9dRXr1mj4hc9QVESfX3ocIIiayGxOktnhXq7GIRRWTqfkTRJUtOarZLJSCIiGyoJx11UzxfMtMONfXYyQ3k1FxYX7owAC4Cj5EKjcfoGWyai6GDMpYgWGX9LWjx9hT51xhrjtJJzRYnMf%2BVkLyAeP%2BYnjAbJ3ldJYcDpVyZPj7bx50VvepwuujfNjJocALMLzaHsaKnQGgOLRsAcmm4%2BwRGBYsJJbsDukN7JdX8aEN0zFimiOJcLrm%2Bi63yA6s4jw%3D%3D";
const nav_items = [
  {
    name: "ダッシュボード",
    hlink: "/admin",
    Icon: () => (
      <svg className="w-6 h-6 stroke-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "ユーザ検索",
    hlink: "/admin/search",
    Icon: () => (
      <svg className="w-6 h-6 stroke-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    name: "統計",
    hlink: "/admin/insights",
    Icon: () => (
      <svg className="w-6 h-6 stroke-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const nav_items2 = [
  {
    name: "タグ管理",
    hlink: "/admin/tag",
    Icon: () => (
      <svg
        fill="currentColor" xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 ml-0.5" viewBox="0 0 144 144"
     	>
       	<path d="M117.511,58.36L60.91,1.759c-1.2-1.199-2.899-1.899-4.7-1.699l-47.2,3.399c-3,0.2-5.3,2.601-5.6,5.601l-3.4,47.199
      		c-0.1,1.7,0.5,3.4,1.7,4.7l56.6,56.601c2.3,2.3,6.1,2.3,8.5,0l50.7-50.7C119.91,64.459,119.91,60.66,117.511,58.36z M19.71,19.66
          c4.8-4.8,12.5-4.8,17.3,0c4.8,4.8,4.8,12.5,0,17.3c-4.8,4.8-12.5,4.8-17.3,0C14.911,32.259,14.911,24.459,19.71,19.66z
       		M99.91,64.759l-35.1,35.101c-1.2,1.2-3.1,1.2-4.2,0l-32.7-32.601c-1.2-1.199-1.2-3.1,0-4.199l35.1-35.101c1.2-1.2,3.1-1.2,4.2,0
          l32.6,32.601C101.011,61.66,101.011,63.56,99.91,64.759z"/>
      </svg>
    ),
  },
  {
    name: "テンプレート管理",
    hlink: "/admin/template",
    Icon: () => (
      <svg
        fill="currentColor" xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 ml-0.5" viewBox="0 0 500 512.22"
     	>
       	<path d="m414.86 206.15 48.95 47.13-74.58 78.33-59.92 16.07c-2.15.42-3-.44-2.65-2.46l13.58-60.74 74.62-78.33zM295.7 347.57c7.32-.2 13.44 5.59 13.64 12.91.2 7.32-5.59 13.43-12.91 13.63-13.43.37-22.78 7.36-26.7 15.62-1.59 3.35-2.26 6.89-1.9 10.12.31 2.74 1.45 5.31 3.5 7.34 5.93 5.9 18.8 8.48 40.55 3.21 3.44-.84 10.38-3.16 19.08-6.07 41.29-13.81 117.15-39.18 128.97-3.93 2.31 6.94-1.43 14.48-8.38 16.8-6.94 2.32-14.48-1.43-16.79-8.37-3.38-10.09-62.95 9.83-95.38 20.67-9.29 3.11-16.71 5.6-21.26 6.7-32.22 7.81-53.66 1.63-65.52-10.18-6.58-6.55-10.24-14.68-11.2-23.26-.92-8.09.59-16.57 4.29-24.36 7.77-16.38 25.36-30.15 50.01-30.83zM103.57 225.85c-7.07 0-12.8-5.73-12.8-12.8 0-7.06 5.73-12.79 12.8-12.79h161.17c7.07 0 12.8 5.73 12.8 12.79 0 7.07-5.73 12.8-12.8 12.8H103.57zm0 82.69c-7.07 0-12.8-5.72-12.8-12.79 0-7.07 5.73-12.8 12.8-12.8h147.39c7.07 0 12.79 5.73 12.79 12.8s-5.72 12.79-12.79 12.79H103.57zm0 82.7c-7.07 0-12.8-5.73-12.8-12.8 0-7.06 5.73-12.79 12.8-12.79h87.51c7.06 0 12.79 5.73 12.79 12.79 0 7.07-5.73 12.8-12.79 12.8h-87.51zM246.01 36.73v43.24c1 13.08 5.56 23.36 13.56 30.2 8.31 7.09 20.71 11.07 37.13 11.36l37.27-.04-87.96-84.76zm96.71 110.34-46.22-.05c-22.76-.36-40.67-6.48-53.52-17.45-13.38-11.44-20.92-27.68-22.45-47.78l-.11-1.76V25.59H63.61c-20.94 0-38.02 17.08-38.02 38.02V448.6c0 20.85 17.16 38.02 38.02 38.02h241.11c15.7 0 30.03-9.98 35.58-24.65 2.47-6.59 9.85-9.92 16.44-7.45 6.59 2.48 9.92 9.85 7.44 16.44-9.32 24.59-33.11 41.26-59.46 41.26H63.61C28.69 512.22 0 483.51 0 448.6V63.61C0 28.67 28.67 0 63.61 0h175.94c3.79 0 7.21 1.65 9.54 4.28l115.27 111.06c2.6 2.5 3.91 5.85 3.91 9.2l.04 74c0 7.07-5.73 12.8-12.79 12.8-7.07 0-12.8-5.73-12.8-12.8v-51.47zm120.87 24.5c-2.27-2.18-4.92-3.2-7.96-3.16-3.03.05-5.62 1.24-7.77 3.48l-17.46 18.18 49 47.3 17.64-18.36c2.11-2.13 2.99-4.9 2.96-7.95-.05-3-1.13-5.72-3.26-7.78l-33.15-31.71zm-89.91 157.2-36.75 9.85c-1.33.26-1.85-.26-1.62-1.5l8.32-37.26 30.05 28.91z"/>
      </svg>
    ),
  },
  {
    name: "ユーザ管理",
    hlink: "/admin/user",
    Icon: () => (
      <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" transform="matrix(1, 0, 0, 1, 0, 0)">
        <g id="SVGRepo_bgCarrier" strokeWidth="0"/>
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"/>
        <g id="SVGRepo_iconCarrier">
          <path d="M20.5 21C21.8807 21 23 19.8807 23 18.5C23 16.1726 21.0482 15.1988 19 14.7917M15 11C17.2091 11 19 9.20914 19 7C19 4.79086 17.2091 3 15 3M3.5 21.0001H14.5C15.8807 21.0001 17 19.8808 17 18.5001C17 14.4194 11 14.5001 9 14.5001C7 14.5001 1 14.4194 1 18.5001C1 19.8808 2.11929 21.0001 3.5 21.0001ZM13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#FFFFFF" strokeWidth="1.608" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
  },
  {
    name: "通知",
    hlink: "/admin/noti",
    Icon: () => (
      <svg className="w-6 h-6 stroke-current"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  /*
  {
    name: "設定",
    hlink: "/admin/settings",
    Icon: () => (
      <svg className="w-6 h-6 stroke-current"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  */
]


import bgColorList from '@/assets/data/colorlist.json'
import Link from "next/link";

const SideBar = () => {
  const [ isHover, setIsHover ] = useState(0)
  const { bgColor, theme } = useThemeContext()

  const mainSidebarColor = bgColorList[theme.name].color[bgColor].main
  const textSidebarColor = bgColorList[theme.name].color[bgColor].text
  const profileSidebarColor = bgColorList[theme.name].color[bgColor].profile
  const notifySidebarColor = bgColorList[theme.name].color[bgColor].notify

  const handleMouseEnter = (e, index, sec) => {
    setIsHover(c => {
      return {
        ...c,
        [index]: { status: true, section: sec },
      }
    })
  }

  const handleMouseLeave = (e, index, sec) => {
    setIsHover(c => {
      return {
        ...c,
        [index]: { status: false, section: sec },
      }
    })
  }

  const navItemStyle = {
      backgroundColor: bgColorList["light"].color["indigo"].text,
      color: mainSidebarColor
  }

  return (
    <>
    {/* <!-- Component Start --> */}
    <div className="flex flex-col items-center w-64 h-full overflow-hidden" style={{ color: textSidebarColor, backgroundColor: mainSidebarColor}}>

      {/* Nav head logo */}
      {/* Nav main area */}
      <div className="w-full px-2">
        {/* Nav 1
        <div className="flex flex-col items-center w-full mt-3 border-t border-gray-700">
          {nav_items.map((el, idx) => {
            return (
              <Link
                href={el.hlink}
                className="flex items-center w-full h-12 px-3 mt-2 rounded"
                onMouseEnter={(e) => handleMouseEnter(e, idx, 1)}
                onMouseLeave={(e) => handleMouseLeave(e, idx, 1)}
                style={ ( isHover[idx]?.status && isHover[idx]?.section == 1) ? { backgroundColor: bgColorList[theme.name].color[bgColor].text, color: bgColorList[theme.name].color[bgColor].main } : {} }
                key={idx}>
                <div className="flex flex-row">
                  {el.Icon()}
                  <span className="ml-2 text-sm font-medium">{el.name}</span>
                </div>
              </Link>
            )
          })}
        </div>
        */}

        {/* Nav menu 2 */}
        <div className="flex flex-col items-center w-full mt-2 border-t border-gray-700">
          {nav_items2.map((el, idx) => {
            return (
              <Link
                href={el.hlink}
                key={idx}
                className="flex items-center w-full h-12 px-3 mt-2 rounded hover:bg-indigo-700"
                onMouseEnter={(e) => handleMouseEnter(e, idx, 2)}
                onMouseLeave={(e) => handleMouseLeave(e, idx, 2)}
                style={ ( isHover[idx]?.status && isHover[idx]?.section == 2) ? { backgroundColor: bgColorList[theme.name].color[bgColor].text, color: bgColorList[theme.name].color[bgColor].main } : {} }
                >
                <div className="flex flex-row">
                  {el.Icon()}
                  <span className="ml-2 text-sm font-medium">{el.name}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      {/* Nav footer - Account */}
      {/*
      <a className="flex items-center justify-center w-full h-16 mt-auto" href="/admin/account" style={{ color: textSidebarColor, backgroundColor: mainSidebarColor}}>
        <svg className="w-6 h-6 stroke-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="ml-2 text-sm font-medium">アカウント設定</span>
      </a>*/}
    </div>
    {/* <!-- Component End  --> */}
    </>
  );
};

SideBar.propTypes = {};

export default SideBar;