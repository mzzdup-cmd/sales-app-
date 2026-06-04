// Firebase Config

const firebaseConfig = {

    apiKey: "AIzaSyChDLlxHqFbv6rsl5hyKRen3IME7da6c5U",

    authDomain: "sales-app-74357.firebaseapp.com",

    projectId: "sales-app-74357",

    storageBucket: "sales-app-74357.firebasestorage.app",

    messagingSenderId: "481008876572",

    appId: "1:481008876572:web:0a24f603311e1771f833d9"
};

// init firebase

firebase.initializeApp(firebaseConfig);

// firestore

const db = firebase.firestore();
