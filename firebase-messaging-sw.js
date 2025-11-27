importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyBSwc_DJylEMgml9oYYCMt4CeSw95RHH9c",
  projectId: "test-69fbd",
  messagingSenderId: "309074637934",
  appId: "1:309074637934:web:5b8448ba019e0cba8a227f",
});


const firebaseConfig = {
    apiKey: "AIzaSyBSwc_DJylEMgml9oYYCMt4CeSw95RHH9c",
    authDomain: "test-69fbd.firebaseapp.com",
    projectId: "test-69fbd",
    storageBucket: "test-69fbd.firebasestorage.app",
    messagingSenderId: "309074637934",
    appId: "1:309074637934:web:5b8448ba019e0cba8a227f",
    measurementId: "G-P67RHEKWG5"
  };

const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler(payload => {
  const title = payload.notification.title || "Notification";
  const options = { body: payload.notification.body || "" };
  return self.registration.showNotification(title, options);
});
