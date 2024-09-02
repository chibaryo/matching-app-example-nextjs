'use client'
import React, { useRef, useEffect, useState, useContext } from "react";
import { useRouter, usePathname } from 'next/navigation'
// ChakraUI
import {
    Table,
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
    Button,
  } from '@chakra-ui/react'

  import dayjs from 'dayjs'; // Import dayjs for date formatting

  // Firestore
import { getFirestore, addDoc, collection, collectionGroup, getDocs, where, query, doc, serverTimestamp, get, getDoc, setDoc, updateDoc, orderBy, arrayUnion, arrayRemove, writeBatch, deleteDoc } from 'firebase/firestore'
import { db, firebaseAuth } from '@/utils/firebase/firebaseinit'
import { getUserByUid } from '@/action/google/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const NotiDetail = ({ params }) => {
    const running = useRef(true)
    const [ reports, setReports ] =  useState([])
    const [userMap, setUserMap] = useState({});
    const [usersWithoutReports, setUsersWithoutReports] = useState([]);
    const [ notification , setNotification ] = useState([])

    const [ loginUser, setLoginUser ] = useState(null)

    const fetchUserByUid = async (uid) => {
      const userRef = collection(db, "users");
      const q = query(userRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      let userData = null;
      querySnapshot.forEach((doc) => {
        userData = doc.data();
      });
      return userData;
    };

    const fetchNotificationByNotificationId = async (notificationId) => {
        try {
          const notificationsRef = collection(db, 'notifications'); // Replace 'notifications' with your actual collection name
          const q = query(notificationsRef, where('notificationId', '==', notificationId));
          const querySnapshot = await getDocs(q);
      
          if (!querySnapshot.empty) {
            // Assuming notificationId is unique, return the first document found
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
          } else {
            throw new Error(`Notification with notificationId ${notificationId} does not exist.`);
          }
        } catch (error) {
          console.error('Error fetching notification:', error);
          throw error; // Rethrow the error for the caller to handle
        }
      };

      const fetchAllUsers = async () => {
        const users = [];
        const userRef = collection(db, "users");
        const querySnapshot = await getDocs(userRef);
        querySnapshot.forEach((doc) => {
          users.push(doc.data());
        });
        return users;
      };

      const fetchReports = async () => {
        let posts = [];
        const docsRef = collection(db, "reports");
        const querySnapshot = await getDocs(query(docsRef, where("notificationId", "==", params.slug), orderBy("createdAt", "asc")));
        querySnapshot.forEach(async (doc) => {
          posts.push(doc.data());
        });
        return posts;
      };

      const getUsersWithoutReports = (allUsers, reportUids) => {
        return allUsers.filter(user => !reportUids.has(user.uid));
      };

      useEffect(() => {
        (async () => {
          if (process.env.NODE_ENV === 'development' && running.current) {
            running.current = false;
            return;
          }
      
          const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
              console.log('User Uid: ', user.uid);
              console.log('User email: ', user.email);
              
              // Get user info from Firestore
              const resUser = await getUserByUid(user.uid);
              console.log("user info: ", resUser);
      
              if (resUser && typeof resUser === 'object') {
                setLoginUser({
                  name: resUser.name,
                  email: resUser.email,
                  uid: resUser.uid,
                  isAdmin: resUser.isAdmin,
                  officeLocation: resUser.officeLocation,
                  jobLevel: resUser.jobLevel,
                  department: resUser.department,
                });
      
                // Fetch all users, posts, and the specific notification
                const allUsers = await fetchAllUsers();
                const posts = await fetchReports();
                const gotNotification = await fetchNotificationByNotificationId(params.slug);
                setNotification(gotNotification);
      
                // Create a map of users by uid to get department info
                const tmpUserMap = {};
                for (const user of allUsers) {
                  tmpUserMap[user.uid] = user;
                }
                setUserMap(tmpUserMap)
      
                // If the user is a "責任者", filter reports and usersWithoutReports according to their department
                let filteredPosts = posts;
                let filteredUsersWithoutReports = allUsers;
      
                if (resUser.jobLevel === "責任者") {
                  filteredPosts = posts.filter(post => {
                    const postUser = tmpUserMap[post.uid];
                    return postUser && resUser.department.some(dept => postUser.department.includes(dept));
                  });
      
                  const reportUids = new Set(filteredPosts.map(post => post.uid));
      
                  filteredUsersWithoutReports = getUsersWithoutReports(allUsers, reportUids).filter(user =>
                    resUser.department.some(dept => user.department.includes(dept))
                  );
                } else {
                  const reportUids = new Set(posts.map(post => post.uid));
                  filteredUsersWithoutReports = getUsersWithoutReports(allUsers, reportUids);
                }
      
                console.log("Filtered posts: ", JSON.stringify(filteredPosts));
                //
                setReports(filteredPosts);
                setUsersWithoutReports(filteredUsersWithoutReports);
              }
            } else {
              console.log("No user is signed in.");
            }
          });
      
          return () => {
            unsubscribe();
          };
        })();
      }, [params.slug]);
                  
    
    /*
    const fetchTagtidyByUid = async (uid) => {
  let posts = []
  const docsRef = collection(db, "tagtidy")
  const querySnapshot = await getDocs(query(docsRef, where('firebaseUid', '==', uid), where('subscription_status', '==', true), orderBy("createdAt", "asc")))
  querySnapshot.forEach(async (doc) => {
    posts.push(doc.data())
  })

  return { posts: JSON.stringify(posts) }
}
 
    */
    return (
        <>
             <TableContainer>
                <Table>
                    <Thead>
                    <Tr>
                        <Th>タイトル</Th>
                        <Th>本文</Th>
                    </Tr>
                    </Thead>
                    <Tbody>
                    <Tr>
                        <Td>{notification.notiTitle}</Td>
                        <Td>{notification.notiBody}</Td>
                    </Tr>
                    </Tbody>
                </Table>
            </TableContainer>

            <span>回答済み</span>
            {userMap && Object.keys(userMap).length > 0 && (
            <TableContainer>
              <Table>
                <Thead>
                    <Tr>
                      <Th>回答日時</Th>
                      <Th>回答更新日時</Th>
                        <Th>名前</Th>
                        <Th>怪我の状態</Th>
                        <Th>出社可否</Th>
                        <Th>メッセージ</Th>
                        <Th>位置情報</Th>
                    </Tr>
                </Thead>
                <Tbody>
            {reports.map((el, idx) => (
              <Tr key={idx}>
                <Td>[{dayjs(el.createdAt.seconds * 1000).format('M/DD hh:mm')}]</Td>
                { el.createdAt.seconds != el.updatedAt.seconds
                  ? <Td>[{dayjs(el.updatedAt.seconds * 1000).format('M/DD hh:mm')}]</Td>
                  : <Td></Td>
                }
                <Td>{userMap[el.uid]["name"]}</Td>
                <Td>{el.injuryStatus}</Td>
                <Td>{el.attendOfficeStatus}</Td>
                <Td>{el.message}</Td>
                <Td>{el.location}</Td>
              </Tr>
            ))}
                </Tbody>
                </Table>
            </TableContainer>
          )}

            <div>未回答ユーザ一覧:</div>
      <TableContainer>
        <Table>
          <Thead>
            <Tr>
              <Th>Username</Th>
              <Th>Email</Th>
            </Tr>
          </Thead>
          <Tbody>
            {usersWithoutReports.map((user, idx) => (
              <Tr key={idx}>
                <Td>{user.name}</Td>
                <Td>{user.email}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
        </>
    )
}

export default NotiDetail