import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getRuntimeConfig } from '@/config/runtime';

const runtimeConfig = getRuntimeConfig();
const host = runtimeConfig.host || 'localhost';

const firebaseConfig = {
  apiKey: "AIzaSyDf6WG9a48u2qDoeAfIbqwt3Z0QxH7SzFY",
  authDomain: "bunker-m.firebaseapp.com",
  projectId: "bunker-m",
  storageBucket: "bunker-m.firebasestorage.app",
  messagingSenderId: "1017702751216",
  appId: "1:1017702751216:web:cd9bfbf736c1505a025b35"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configure auth to use our proxy
auth.config.emulator = {
  url: `https://${host}:2000/auth/`
};

// Override the default auth domain to use our proxy
auth.config.authDomain = `${host}:2000`;

export { auth };