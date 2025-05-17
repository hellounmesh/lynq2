const baseURL = "https://lynqdxb.onrender.com"
const firebaseConfig = {
    apiKey: "AIzaSyBHdUEAia7NTucKGIrqPBMSqXV9q0s6mkk",
    authDomain: "notify-4c612.firebaseapp.com",
    projectId: "notify-4c612",
    storageBucket: "notify-4c612.firebasestorage.app",
    messagingSenderId: "1098548785389",
    appId: "1:1098548785389:web:5e7ac1b6c981b116b31ce4",
    measurementId: "G-T355E98TWG"
  };
  const app = firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();


const loginBtn = document.getElementById("loginBtn")
const handleLogin = async() => {

    try {
        await Notification.requestPermission();
        const token = await messaging.getToken({
            vapidKey: 'BNiclUBKzK7-Then1Sa32MeqIECyMRdXo_SZl6koWcgrVVMhMdJpJwaVsj2I2NQbxIQiL48UTbwOpdOkD2AtIPQ',
            serviceWorkerRegistration: await navigator.serviceWorker.register('../../firebase-messaging-sw.js')
          });

          if (!token) {
            alert("Unable to get device token. Notifications may be blocked.");
            return;
        }
        const email = document.getElementById("Email").value.trim();
        const password = document.getElementById("Password").value.trim();

        const payload = {
            email,
            password,
            deviceToken:token,
            platform:"web",
            deviceId:generateDeviceId(),

        }

        const resp = await fetch(`${baseURL}/public/admin/signIn`, {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            body:JSON.stringify(payload)
        });

        const data = await resp.json();

        if(resp.status === 200) {
            const token = data.data?.token;
            localStorage.setItem("adminToken",token)
          
            setTimeout( () => {
                window.location.href = '../../index.html';

            },3000)
        }else {
            const message = data.data?.message
            alert(message);
        }

    }catch(error){
        console.error("Error in handle login function",error)
        alert(error)
    }
}

function generateDeviceId() {
    const storedId = localStorage.getItem("deviceId");
    if (storedId) return storedId;
    const newId = `web_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("deviceId", newId);
    return newId;
}



loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogin();
  });