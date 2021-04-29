// Get registration token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.

importScripts('https://www.gstatic.com/firebasejs/8.2.1/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/8.2.1/firebase-messaging.js')

/*
Initialize the Firebase app in the service worker by passing in the messagingSenderId.
*/
var firebaseConfig = {
  apiKey: "AIzaSyDZA6mw43AwGw7wSeKQVhsEIE2eHgZ9nO8",
    authDomain: "test-2822e.firebaseapp.com",
    databaseURL: "https://test-2822e.firebaseio.com",
    projectId: "test-2822e",
    storageBucket: "test-2822e.appspot.com",
    messagingSenderId: "478065906795",
    appId: "1:478065906795:web:e79d879a47217a5dc58d2e",
    measurementId: "G-C773D61RYW"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);


const messaging = firebase.messaging();
