//importScripts(`${self.origin}/sw.js`)
importScripts('https://www.gstatic.com/firebasejs/10.4.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging-compat.js')

const firebaseApp = firebase.initializeApp({
  apiKey: "AIzaSyB0HNNW3I874VnNVIooCBf_BA_a0fDyfHg",
  authDomain: "matching-app-example.firebaseapp.com",
  projectId: "matching-app-example",
  storageBucket: "matching-app-example.appspot.com",
  messagingSenderId: "608552419699",
  appId: "1:608552419699:web:02fff14c6b7bd454488506",
  measurementId: "G-W1BBW1C7XM"
})
const messaging = firebase.messaging(firebaseApp)

/*
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  )

  self.registration.showNotification(
    payload.notification?.title,
    {
      body: payload.notification?.body,
//      image: payload.notification?.image,
//      icon: payload?.notification?.icon,
//      badge: payload?.data?.badge,
      actions: [
        {
          action: 'action name 1',
          title: 'いいね',
          icon: '/icons/action-icon-1.png'
        },
        {
          action: 'action name 2',
          title: '結構です',
          icon: '/icons/action-icon-2.png'
        },
      ]
    }
  )
}) */

self.addEventListener('push', (event) => {
  if (self.Notification == null || self.Notification.permission !== 'granted') {
    return;
  }

  let data = {}

  if (event.data) {
    data = event.data.json();
    console.log("data: ", data);
    console.log("data.data: ", data.data);
    console.log("data.notification.title: ", data.notification.title);
  }

  event.waitUntil(
    (() => {
      return self.registration.showNotification(data.notification.title, {
        body: data.notification.body,
        image: data.notification.image,
        data: {
          url: data.data.url,
          boo: "bar",
        },
        webpush: {
          fcmOptions: {
            link: data.notification.click_action,
          },
        },
        actions: [
          {
            action: "action name 1",
            title: "いいね",
          },
          {
            action: "action name 2",
            title: "結構です",
          }
        ]
      });
    })()
  )
});


// A2HS
//self.addEventListener("fetch", (event) => {});
