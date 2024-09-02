"use client"

import React, { useRef, useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'

const tabs = [
  { name: "news", desc: "ニュース" },
  { name: "location", desc: "地名" },
  { name: "hot_spring", desc: "温泉" },
  { name: "cuisine", desc: "料理" },
  { name: "characteristic", desc: "特色" }
]

const TagGenreTabs = (props) => {
  const [ activeTab, setActiveTab ] = useState("news")

  const changeActiveTab = async (tab) => {
    setActiveTab(tab)
    props.setActiveTab(tab)
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
        {tabs.map((tab) => {
          return (
            <li className="me-2" key={tab.name}>
              <a
                href="#"
                onClick={() => changeActiveTab(tab.name)}
                className={activeTab == tab.name
                ? "inline-flex items-center justify-center p-4 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active dark:text-blue-500 dark:border-blue-500 group"
                : "inline-flex items-center justify-center p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 group"
                }
              >
                {tab.desc}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default TagGenreTabs