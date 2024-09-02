'use client'

import React, { useRef, useEffect, useState, FormEvent } from 'react'
import { firebaseApp, firebaseAuth, db } from '@/utils/firebase/firebaseinit'

import TagGenreTabs from '@/components/common/form/TagGenreTabs'
import { getParentEngTitlesFromCurrentSubscriber } from '@/action/google/firestore'
// Context
import { useAuthContext } from '@/context/AuthContext'
import { useFcmToken } from '@/hooks/fcmToken/useFcmToken'
import { themes, useThemeContext } from "@/context/ThemeContext";

import { fcmUnSubscribeFromTopic } from '@/action/google/unSubscribeFromTopic'
import { fcmSubscribeToTopic } from '@/action/google/subscribeToTopic'
import { readFromFirestore } from '@/action/google/firestore'
import { updateDoc, collection, doc, setDoc, getDocs, where, query, deleteDoc } from 'firebase/firestore'

import bgColorList from '@/assets/data/colorlist.json'

const Settings = () => {
  const running = useRef(true)
  const { fcmToken, notificationPermissionStatus } = useFcmToken()
  const { currentUser, token } = useAuthContext()

  const [ items, setItems ] = useState([])
  const [ activeTab, setActiveTab ] = useState("news")
  const [ reviewTags, setReviewTags ] = useState([])

  const [isSocialChecked, setIsSocialChecked] = useState(false)
  const [isPoliticsChecked, setIsPoliticsChecked] = useState(false)
  const [isWeatherChecked, setIsWeatherChecked] = useState(false)
  const [isSportsChecked, setIsSportsChecked] = useState(false)
  const [isInternationalChecked, setIsInternationalChecked] = useState(false)

  const [isEconomicsChecked, setIsEconomicsChecked] = useState(false)
  const [isScienceChecked, setIsScienceChecked] = useState(false)
  const [isCultureChecked, setIsCultureChecked] = useState(false)
  const [isEducationChecked, setIsEducationChecked] = useState(false)
  const [isDiplomacyChecked, setIsDiplomacyChecked] = useState(false)

  const { bgColor, theme, setBgColor, setTheme } = useThemeContext()

  const mainSidebarColor = bgColorList[theme.name].color[bgColor].main
  const textSidebarColor = bgColorList[theme.name].color[bgColor].text
  const profileSidebarColor = bgColorList[theme.name].color[bgColor].profile
  const notifySidebarColor = bgColorList[theme.name].color[bgColor].notify

  useEffect(() => {
    (async () => {
      if (process.env.NODE_ENV == 'development') {
        if (running.current) {
          running.current = false
          return
        }
      }
  
      const resp = await readFromFirestore("tags")
      setItems(JSON.parse(resp.posts))

      // Set user preferred tags if exsts
      let tags_perferred = getParentEngTitlesFromCurrentSubscriber(currentUser.uid)
      setReviewTags([...reviewTags, tags_perferred])

    })()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const notcheckedTags
     = items
        .map(i => i.tagEngTitle)
        .filter(i => reviewTags.indexOf(i) == -1)
    console.log("notcheckedTags", notcheckedTags)

    reviewTags.forEach(async(tag) => {
      fcmSubscribeToTopic(fcmToken, tag)
      addnewuserToTagSubcollection(tag)
    })
    notcheckedTags.forEach(async (el) => {
      fcmUnSubscribeFromTopic(fcmToken, el)
      removeuserFromTagSubcollection(el)
    })


  }

  const addnewuserToTagSubcollection = async (tagEngTitle) => {
    const collectionRef = collection(db, "tags")
    let q = query(collectionRef, where('tagEngTitle', "==", tagEngTitle))
    const snapshot_on = await getDocs(q)

    // Get Userref
    const userRef = doc(db, "users", currentUser.uid)
    // 
    snapshot_on.forEach(async(item) => {
      const docRef = doc(db, "tags", item.id, "subscribers", currentUser.uid)
      console.log("item.id", item.id)
      try {
        await setDoc(docRef, {
          uid: currentUser.uid,
          userRef: userRef
        })
      } catch (err) {
        console.error (err)
      }
    })
  }

  const removeuserFromTagSubcollection = async (tagEngTitle) => {
    const collectionRef = collection(db, "tags")
    let q = query(collectionRef, where('tagEngTitle', "==", tagEngTitle))
    const snapshot_on = await getDocs(q)

    // Get Userref
    const userRef = doc(db, "users", currentUser.uid)
    // 
    snapshot_on.forEach(async(item) => {
      const docRef = doc(db, "tags", item.id, "subscribers", currentUser.uid)
      console.log("item.id", item.id)
      try {
        await deleteDoc(docRef)
      } catch (err) {
        console.error (err)
      }
    })
  }

  const handleChangeChecked = async (e) => {
    if (reviewTags.includes(e.target.value)) {
      setReviewTags(
        reviewTags.filter((tag) => tag !== e.target.value)
      )
    } else {
      setReviewTags([...reviewTags, e.target.value])
    }
  }

  return (
    <>
      トピック（タグ）購読設定
    <section>

      {/* Tailwind Tabs*/}
      <TagGenreTabs setActiveTab={setActiveTab} />

      <form className='flex flex-col gap-12 w-full mx-4 my-4' onSubmit={(e) => handleSubmit(e)}>
        {/* Refactor */}
        <ul className='w-full text-sm'>
          {items
            .filter(item => item.selGenre == activeTab)
            .map((val, idx) => {
              return (
                <li
                  className='flex items-center border-b'
                  key={idx}>
                  <label className='my-2 flex flex-row cursor-pointer select-none items-center'>
                  <span className='basis-1/2 mx-2 label flex items-center text-sm font-medium text-black'>{val.tagJapTitle}</span>
                  <div className='basis-1/2 relative'>
                  <input
                    id={val.tagEngTitle}
                    type="checkbox"
                    value={val.tagEngTitle}
                    checked={reviewTags.includes(val.tagEngTitle)}
                    onChange={(e) => handleChangeChecked(e)}
                    className='peer sr-only'
                  />
                  <div
                    className='block h-8 w-14 rounded-full'
                    style={theme.name == "dark"
                    ? { backgroundColor: textSidebarColor }
                    : { backgroundColor: mainSidebarColor }
                  }
                  ></div>
                  <div
                    className='dot absolute left-1 top-1 h-6 w-6 bg-white rounded-full transition peer-checked:translate-x-full' //bg-white peer-checked:bg-blue-600
                    style={
                      { backgroundColor: reviewTags.includes(val.tagEngTitle) ? bgColorList["light"].color[bgColor].text : "rgb(255,225,255)" }
                    }
                    >
                  </div>
                  </div>
                  </label>
                </li>
              )
            })
          }
        </ul>
      <button
        className="w-1/2 bg-green-400 px-5 py-3 text-sm shadow-sm font-medium tracking-wider text-green-100 rounded-full hover:shadow-2xl hover:bg-green-500"
        type="submit"
        >
        登録
      </button>
      </form>

        {/* End Refactor */}
{/*         <div>
          <label className='my-2 flex flex-row cursor-pointer select-none items-center'>
            <span className='basis-1/2 mx-2 label flex items-center text-sm font-medium text-black'>社会</span>
            <div className='basis-1/2 relative'>
              <input
                type='checkbox'
                  checked={isSocialChecked}
                  onChange={() => setIsSocialChecked(!isSocialChecked)}
                  className='peer sr-only'
              />
              <div className='block h-8 w-14 rounded-full bg-[#E5E7EB]'></div>
              <div className='dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:bg-blue-600 peer-checked:translate-x-full'></div>
            </div>
          </label>

          <label className='my-2 flex flex-row cursor-pointer select-none items-center'>
            <span className='basis-1/2 mx-2 label flex items-center text-sm font-medium text-black'>政治</span>
            <div className='basis-1/2 relative'>
              <input
                type='checkbox'
                checked={isPoliticsChecked}
                onChange={() => setIsPoliticsChecked(!isPoliticsChecked)}
                className='peer sr-only'
              />
              <div className='block h-8 w-14 rounded-full bg-[#E5E7EB]'></div>
              <div className='dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:bg-blue-600 peer-checked:translate-x-full'></div>
            </div>
          </label>

      <label className='my-2 flex flex-row cursor-pointer select-none items-center'>
        <span className='basis-1/2 mx-2 label flex items-center text-sm font-medium text-black'>天気</span>
        <div className='basis-1/2 relative'>
          <input
            type='checkbox'
            checked={isWeatherChecked}
            onChange={() => setIsWeatherChecked(!isWeatherChecked)}
            className='peer sr-only'
          />
          <div className='block h-8 w-14 rounded-full bg-[#E5E7EB]'></div>
          <div className='dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:bg-blue-600 peer-checked:translate-x-full'></div>
        </div>
      </label>

      <label className='my-2 flex flex-row cursor-pointer select-none items-center'>
        <span className='basis-1/2 mx-2 label flex items-center text-sm font-medium text-black'>スポーツ</span>
        <div className='basis-1/2 relative'>
          <input
            type='checkbox'
            checked={isSportsChecked}
            onChange={() => setIsSportsChecked(!isSportsChecked)}
            className='peer sr-only'
          />
          <div className='block h-8 w-14 rounded-full bg-[#E5E7EB]'></div>
          <div className='dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:bg-blue-600 peer-checked:translate-x-full'></div>
        </div>
      </label>

      <label className='my-2 flex flex-row cursor-pointer select-none items-center'>
        <span className='basis-1/2 mx-2 label flex items-center text-sm font-medium text-black'>国際</span>
        <div className='basis-1/2 relative'>
          <input
            type='checkbox'
            checked={isInternationalChecked}
            onChange={() => setIsInternationalChecked(!isInternationalChecked)}
            className='peer sr-only'
          />
          <div className='block h-8 w-14 rounded-full bg-[#E5E7EB]'></div>
          <div className='dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:bg-blue-600 peer-checked:translate-x-full'></div>
        </div>
      </label>
    </div>
    {/* Col 2 
  {/*  <div>
      <label className='my-2 flex flex-row cursor-pointer select-none items-center'>
        <span className='basis-1/2 mx-2 label flex items-center text-sm font-medium text-black'>経済</span>
        <div className='basis-1/2 relative'>
          <input
            type='checkbox'
            checked={isEconomicsChecked}
            onChange={() => setIsEconomicsChecked(!isEconomicsChecked)}
            className='peer sr-only'
          />
          <div className='block h-8 w-14 rounded-full bg-[#E5E7EB]'></div>
          <div className='dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:bg-blue-600 peer-checked:translate-x-full'></div>
        </div>
      </label>
      <label className='my-2 flex flex-row cursor-pointer select-none items-center'>
        <span className='basis-1/2 mx-2 label flex items-center text-sm font-medium text-black'>科学</span>
        <div className='basis-1/2 relative'>
          <input
            type='checkbox'
            checked={isScienceChecked}
            onChange={() => setIsScienceChecked(!isScienceChecked)}
            className='peer sr-only'
          />
          <div className='block h-8 w-14 rounded-full bg-[#E5E7EB]'></div>
          <div className='dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:bg-blue-600 peer-checked:translate-x-full'></div>
        </div>
      </label>
      <label className='my-2 flex flex-row cursor-pointer select-none items-center'>
        <span className='basis-1/2 mx-2 label flex items-center text-sm font-medium text-black'>文化</span>
        <div className='basis-1/2 relative'>
          <input
            type='checkbox'
            checked={isCultureChecked}
            onChange={() => setIsCultureChecked(!isCultureChecked)}
            className='peer sr-only'
          />
          <div className='block h-8 w-14 rounded-full bg-[#E5E7EB]'></div>
          <div className='dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:bg-blue-600 peer-checked:translate-x-full'></div>
        </div>
      </label>
      <label className='my-2 flex flex-row cursor-pointer select-none items-center'>
        <span className='basis-1/2 mx-2 label flex items-center text-sm font-medium text-black'>教育</span>
        <div className='basis-1/2 relative'>
          <input
            type='checkbox'
            checked={isEducationChecked}
            onChange={() => setIsEducationChecked(!isEducationChecked)}
            className='peer sr-only'
          />
          <div className='block h-8 w-14 rounded-full bg-[#E5E7EB]'></div>
          <div className='dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:bg-blue-600 peer-checked:translate-x-full'></div>
        </div>
      </label>
      <label className='my-2 flex flex-row cursor-pointer select-none items-center'>
        <span className='basis-1/2 mx-2 label flex items-center text-sm font-medium text-black'>外交</span>
        <div className='basis-1/2 relative'>
          <input
            type='checkbox'
            checked={isDiplomacyChecked}
            onChange={() => setIsDiplomacyChecked(!isDiplomacyChecked)}
            className='peer sr-only'
          />
          <div className='block h-8 w-14 rounded-full bg-[#E5E7EB]'></div>
          <div className='dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:bg-blue-600 peer-checked:translate-x-full'></div>
        </div>
      </label>
    </div>
      <button
        className="basis-1/8 bg-green-400 px-5 py-3 text-sm shadow-sm font-medium tracking-wider  text-green-100 rounded-full hover:shadow-2xl hover:bg-green-500"
        type="submit"
        >
        登録
      </button>
    </form> */}
    </section>
    </>
  )
}

export default Settings