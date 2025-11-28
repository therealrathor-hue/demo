// Wait DOM content
document.addEventListener("DOMContentLoaded", async () => {

  // --- USERNAME FETCH ---
  let username = "";
  const el = document.getElementById("pageUsername");
  console.log(el.value)
  if (el) username = el.value;
  
  if (!username) {
    const u = new URL(window.location.href).searchParams.get("user");
    if (u) username = u;
  }

  let socketURL = "";

  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    socketURL = "http://localhost:3006";   // Local
  } else {
    socketURL = "http://13.233.131.208:3006"; // "https://zxf9lvwg-3006.inc1.devtunnels.ms";  // Live
  }
  
  console.log({hostname})
  console.log({socketURL})
  const socket = io(socketURL, {
    transports: ["websocket", "polling"],
    path: "/socket.io/",
    withCredentials: false,
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 500
  });
  
  if (!socket) {
    console.error("Socket is null");
  } else {
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      if (username) socket.emit("register-user", { username });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });
  }

  // const firebaseConfig = {
  //   apiKey: "AIzaSyBSwc_DJylEMgml9oYYCMt4CeSw95RHH9c",
  //   authDomain: "test-69fbd.firebaseapp.com",
  //   projectId: "test-69fbd",
  //   storageBucket: "test-69fbd.firebasestorage.app",
  //   messagingSenderId: "309074637934",
  //   appId: "1:309074637934:web:5b8448ba019e0cba8a227f",
  //   measurementId: "G-P67RHEKWG5"
  // };
  // console.log(window.firebase)
  // if (window.firebase) {
  //   firebase.initializeApp(firebaseConfig);
  //   const messaging = firebase.messaging();

  //   try {
  //     await messaging.requestPermission();
  //     const token = await messaging.getToken();
  //     console.log({token, username})
  //     if (token && username) {
  //       await fetch("/save-fcm-token", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ token })
  //       });

  //       if (socket) socket.emit("save-fcm-token", { username, token });
  //     }

  //     messaging.onMessage((payload) => {
  //       alert(`Push: ${payload.notification.title} - ${payload.notification.body}`);
  //     });

  //   } catch (e) {
  //     console.warn("FCM permission/token failed:", e);
  //   }
  // }

  // --- DOM ELEMENTS ---
  const sendBtn = document.getElementById("sendBtn");
  const sendToUserEl = document.getElementById("sendToUser");
  const messageEl = document.getElementById("message");

  // --- SOCKET INCOMING MESSAGE ---
  if (socket) {
    socket.on("receive-notification", (data) => {
      const d = document.createElement("div");
      console.log(data)
      d.textContent = `${data.from}: ${data.message}`;
      d.style.padding = "8px";
      d.style.background = "#ffeecc";
      d.style.margin = "5px";
      document.body.prepend(d);
    });

    socket.on("deploy-refresh", () => {
      alert("New update available. Refreshing!");
      console.log("New deployment detected — refreshing...");
      window.location.reload();
    });
  }

  // --- SEND MESSAGE ---
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      const to = sendToUserEl.value.trim();
      const message = messageEl.value.trim();

      console.log({ to, message });

      if (!to || !message) {
        return alert("Provide receiver and message");
      }

      if (!socket || !socket.connected) {
        return alert("Socket not connected!");
      }

      socket.emit("send-notification", { from: username, to, message });

      messageEl.value = "";
    });
  }
});
