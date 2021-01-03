// Get registration token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.

importScripts('https://www.gstatic.com/firebasejs/4.13.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/4.13.0/firebase-messaging.js')

/*
Initialize the Firebase app in the service worker by passing in the messagingSenderId.
*/
firebase.initializeApp({
    'messagingSenderId': '1034981325790'
})


const messaging = firebase.messaging();
