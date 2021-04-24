// Get registration token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.

importScripts('https://www.gstatic.com/firebasejs/8.2.1/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/8.2.1/firebase-messaging.js')

/*
Initialize the Firebase app in the service worker by passing in the messagingSenderId.
*/
var firebaseConfig = {
    apiKey: "AIzaSyCsxp_cLGjtePSDKH95MtD5XKg-iLXE8j4",
    authDomain: "auth-c0cb3.firebaseapp.com",
    databaseURL: "https://auth-c0cb3.firebaseio.com",
    projectId: "auth-c0cb3",
    storageBucket: "auth-c0cb3.appspot.com",
    messagingSenderId: "1034981325790",
    appId: "1:1034981325790:web:d5b3913ec1bd9c0137fb4f",
    measurementId: "G-1GCV52KFRG"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);


const messaging = firebase.messaging();
