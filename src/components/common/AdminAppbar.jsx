'use client'
import React, { useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { themes, useThemeContext } from "@/context/ThemeContext";
import { useAuthContext } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

import bgColorList from '@/assets/data/colorlist.json'
import { logout } from "@/utils/firebase/firebaseinit";

const AdminAppbar = () => {
  const { currentUser, token } = useAuthContext()
  const { bgColor, theme, setBgColor, setTheme } = useThemeContext()
  const router = useRouter()

  const mainSidebarColor = bgColorList[theme.name].color[bgColor].main
  const textSidebarColor = bgColorList[theme.name].color[bgColor].text
  const profileSidebarColor = bgColorList[theme.name].color[bgColor].profile
  const notifySidebarColor = bgColorList[theme.name].color[bgColor].notify
  
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    setTheme(enabled ? themes.dark : themes.light);
    return () => {};
  }, [enabled]);

  const handleChangeColor = (e) => {
    console.log("e.target.value: ", e.target.value)
    setBgColor(e.target.value);
  }

  const handleSignOut = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div
      className="relative w-full h-14 flex place-content-center items-center shadow-2xl"
      style={{ backgroundColor: mainSidebarColor }}
    >
      <div style={{ color: textSidebarColor, backgroundColor: mainSidebarColor}}>
        {currentUser?.displayName != null
        ? <span>ようこそ、{currentUser?.displayName}さん</span>
        : <span>ようこそ、ゲストさん</span>}
      </div>

      {/* <span className="inline-block text-lg" style={{ color: textSidebarColor }}>アプリヘッダ</span> */}
      {theme &&
        (
          <div className="absolute right-0 flex flex-row gap-1 items-center">
            <div className="px-2 py-2 mx-2 space-x-4" style={{ color: textSidebarColor }}>
              <input
                type="checkbox"
                className="mx-2"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              {theme.name}
            </div>
            <div className="px-4 py-2">
            <select
              className={`px-4 py-2 rounded text-${bgColor}-700 bg-cyan-100`}
              value={bgColor}
              onChange={(e) => handleChangeColor(e)}
            >
              <option className="text-indigo-700" value={"indigo"}>
                indigo
              </option>
              <option className="text-orange-700" value={"orange"}>
                Orange
              </option>
              <option className="text-cyan-700" value={"cyan"}>
                Cyan
              </option>
              <option className="text-teal-700" value={"teal"}>
                Teal
              </option>
              <option className="text-violet-700" value={"violet"}>
                Violet
              </option>
              <option className="text-purple-700" value={"purple"}>
                purple
              </option>
              <option className="text-fuchsia-700" value={"fuchsia"}>
                Fuchsia
              </option>
              <option className="text-trueGray-700" value={"trueGray"}>
                trueGray
              </option>
              <option className="text-rose-700" value={"rose"}>
                rose
              </option>
              <option className="text-pink-700" value={"pink"}>
                pink
              </option>
              <option className="text-gray-700" value={"gray"}>
                Gray
              </option>
              <option className="text-white-700" value={"white"}>
                White
              </option>
              <option className="text-black-700" value={"black"}>
                Black
              </option>
            </select>
          </div>
          <button
            type="button"
            className='mx-2 my-2 text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-md px-5 py-2.5 text-center mr-2 mb-2'
            onClick={() => handleSignOut()}
          >
            ログアウト
          </button>
          </div>
        )
      }
    </div>
  )
}

export default AdminAppbar