// import axios from 'axios';
// import * as SecureStore from 'expo-secure-store';

// import { Platform } from 'react-native';

// // Use the active local network IPv4 address for physical devices/LAN
// const BASE_URL = "https://geo-fencing-attendance.onrender.com";

// if (Platform.OS === 'web') {
//     // If running in browser window on the host machine itself
//     BASE_URL = 'http://localhost:3000/api/v1';
// }

// const client = axios.create({
//     baseURL: BASE_URL,
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

// // Add Authorization Header
// client.interceptors.request.use(async (config) => {
//     let token = null;
//     if (Platform.OS === 'web') {
//         try { token = localStorage.getItem('accessToken'); } catch (e) { }
//     } else {
//         token = await SecureStore.getItemAsync('accessToken');
//     }

//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });

// export default client;



//chat gpt
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

let BASE_URL = "https://geo-fencing-attendance-backend.onrender.com/api/v1";

if (Platform.OS === 'web') {
    BASE_URL = 'http://localhost:3000/api/v1';
}

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add Authorization Header
client.interceptors.request.use(async (config) => {
    let token = null;

    if (Platform.OS === 'web') {
        try {
            token = localStorage.getItem('accessToken');
        } catch (e) {}
    } else {
        token = await SecureStore.getItemAsync('accessToken');
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default client;