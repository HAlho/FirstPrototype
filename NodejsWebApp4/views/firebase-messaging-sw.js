// Get registration token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.

importScripts('/__/firebase/7.24.0/firebase-app.js');
importScripts('/__/firebase/7.24.0/firebase-messaging.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();
