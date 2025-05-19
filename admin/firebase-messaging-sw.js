// firebase-messaging-sw.js
// importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
// importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// // Initialize Firebase
// const firebaseConfig = {
//     apiKey: "AIzaSyBHdUEAia7NTucKGIrqPBMSqXV9q0s6mkk",
//     authDomain: "notify-4c612.firebaseapp.com",
//     projectId: "notify-4c612",
//     storageBucket: "notify-4c612.firebasestorage.app",
//     messagingSenderId: "1098548785389",
//     appId: "1:1098548785389:web:5e7ac1b6c981b116b31ce4",
//     measurementId: "G-T355E98TWG"
// };

// firebase.initializeApp(firebaseConfig);
// const messaging = firebase.messaging();

// // Handle background notifications
// messaging.onBackgroundMessage((payload) => {
//     console.log("[firebase-messaging-sw.js] Received background message ", payload);
//     const notificationTitle = payload.notification.title;
//     const notificationOptions = {
//         body: payload.notification.body
//         // icon: "/firebase-logo.png" // Optional
//     };

//     self.registration.showNotification(notificationTitle, notificationOptions);
// });
