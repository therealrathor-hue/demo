importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyBSwc_DJylEMgml9oYYCMt4CeSw95RHH9c",
  projectId: "test-69fbd",
  messagingSenderId: "309074637934",
  appId: "1:309074637934:web:5b8448ba019e0cba8a227f",
});

const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler(payload => {
  const title = payload.notification.title || "Notification";
  const options = { body: payload.notification.body || "" };
  return self.registration.showNotification(title, options);
});
