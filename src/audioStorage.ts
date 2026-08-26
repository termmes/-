// IndexedDB helper for high-performance, lightweight audio caching on mobile & web

const DB_NAME = 'el_hoda_audio_db';
const STORE_NAME = 'audio_tracks';
const DB_VERSION = 1;

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save audio blob/file to IndexedDB
 */
export async function saveAudioToLocalStore(key: string, fileOrBlob: Blob | File): Promise<string> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(fileOrBlob, key);
      req.onsuccess = () => {
        const objectUrl = URL.createObjectURL(fileOrBlob);
        resolve(objectUrl);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save to IndexedDB, fallback to ObjectURL:', err);
    return URL.createObjectURL(fileOrBlob);
  }
}

/**
 * Retrieve audio blob/file from IndexedDB and return an ObjectURL
 */
export async function getAudioFromLocalStore(key: string): Promise<string | null> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && (req.result instanceof Blob || req.result instanceof File)) {
          const objectUrl = URL.createObjectURL(req.result);
          resolve(objectUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Delete audio from IndexedDB
 */
export async function deleteAudioFromLocalStore(key: string): Promise<void> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // silent catch
  }
}

// Preset popular, lightweight background audio tracks for easy 1-click selection
export interface AudioPreset {
  id: string;
  title: string;
  artist: string;
  url: string;
}

export const AUDIO_PRESETS: AudioPreset[] = [
  {
    id: 'quran_calm',
    title: 'تلاوة هادئة وراحة نفسية',
    artist: 'القرآن الكريم',
    url: 'https://server8.mp3quran.net/afs/001.mp3'
  },
  {
    id: 'nature_ambient',
    title: 'أصوات طبيعة هادئة',
    artist: 'موسيقى استرخاء',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-peace-spiritual-114254.mp3'
  },
  {
    id: 'lofi_calm',
    title: 'ألحان هادئة للتركيز والعمل',
    artist: 'هدوء وإلهام',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=soft-rain-ambient-111154.mp3'
  }
];
