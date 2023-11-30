import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getStorage, ref, uploadString } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-storage.js";


const firebaseConfig = {
    apiKey: "AIzaSyDgx1QofSZUsaCqqHkELvzOHR7IWGbJvzk",
    authDomain: "hri001.firebaseapp.com",
    projectId: "hri001",
    storageBucket: "hri001.appspot.com",
    messagingSenderId: "1048508004546",
    appId: "1:1048508004546:web:1ba282886f41db5534a35b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);
const storageRef = ref(storage, 'log-files.txt');

export function uploadToFirebase(fileName, str){
    uploadString(ref(storage, fileName),str).then((snapshot) => {
        console.log('Uploaded log successfully!');
    });
}
