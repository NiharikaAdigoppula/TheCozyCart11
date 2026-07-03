import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let app: any = null;
let auth: any = null;

export async function getFirebase() {
  if (auth) return { app, auth };
  try {
    const res = await fetch('/api/firebase-config');
    if (!res.ok) {
      throw new Error('Failed to fetch firebase config');
    }
    const config = await res.json();
    if (config && config.apiKey) {
      if (!getApps().length) {
        app = initializeApp(config);
      } else {
        app = getApp();
      }
      auth = getAuth(app);
      return { app, auth };
    }
  } catch (err) {
    console.warn('Firebase client initialization skipped or failed:', err);
  }
  return { app: null, auth: null };
}
