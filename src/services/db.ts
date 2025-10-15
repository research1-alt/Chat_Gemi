import { Drawing, User } from '../types';

interface KnowledgeBaseData {
    text: string;
    drawings: Drawing[];
}

const DB_NAME = 'ServiceAI-DB';
const DB_VERSION = 2; 
const KB_STORE_NAME = 'knowledgeBaseStore';
const USER_STORE_NAME = 'users';

let db: IDBDatabase;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening IndexedDB.');
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(KB_STORE_NAME)) {
                dbInstance.createObjectStore(KB_STORE_NAME, { keyPath: 'id' });
            }
            if (event.oldVersion < 2) {
                if (!dbInstance.objectStoreNames.contains(USER_STORE_NAME)) {
                    dbInstance.createObjectStore(USER_STORE_NAME, { keyPath: 'email' });
                }
            }
        };
    });
}

// --- Knowledge Base Functions ---

export async function saveKnowledgeBase(text: string, drawings: Drawing[]): Promise<void> {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(KB_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(KB_STORE_NAME);

    const textPromise = new Promise<void>((resolve, reject) => {
        const request = store.put({ id: 'knowledgeBaseText', value: text });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });

    const drawingsPromise = new Promise<void>((resolve, reject) => {
        const request = store.put({ id: 'drawings', value: drawings });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });

    return new Promise((resolve, reject) => {
        Promise.all([textPromise, drawingsPromise]).then(() => {
            transaction.oncomplete = () => resolve();
        }).catch(err => {
            try {
               transaction.abort();
            } catch (abortErr) {
               console.error('Transaction abort failed:', abortErr);
            }
            reject(err);
        });
    });
}


export async function loadKnowledgeBase(): Promise<KnowledgeBaseData | null> {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(KB_STORE_NAME, 'readonly');
    const store = transaction.objectStore(KB_STORE_NAME);

    const textRequest = store.get('knowledgeBaseText');
    const drawingsRequest = store.get('drawings');

    return new Promise((resolve, reject) => {
        let text: string | undefined;
        let drawings: Drawing[] | undefined;
        let finished = 0;

        const checkDone = () => {
            if (finished === 2) {
                if (text === undefined && drawings === undefined) {
                    resolve(null);
                } else {
                    resolve({ text: text || '', drawings: drawings || [] });
                }
            }
        };
        
        textRequest.onsuccess = () => {
            if (textRequest.result) {
                text = textRequest.result.value;
            }
            finished++;
            checkDone();
        };

        drawingsRequest.onsuccess = () => {
            if (drawingsRequest.result) {
                drawings = drawingsRequest.result.value;
            }
            finished++;
            checkDone();
        };

        const onError = (event: Event) => {
            console.error('Error in loading from DB', (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
        };

        textRequest.onerror = onError;
        drawingsRequest.onerror = onError;
    });
}

export async function clearKnowledgeBase(): Promise<void> {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(KB_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(KB_STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}


// --- User Functions ---

export async function hasUsers(): Promise<boolean> {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(USER_STORE_NAME, 'readonly');
    const store = transaction.objectStore(USER_STORE_NAME);
    const request = store.count();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result > 0);
        request.onerror = () => reject(request.error);
    });
}

export async function getUsers(): Promise<User[]> {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(USER_STORE_NAME, 'readonly');
    const store = transaction.objectStore(USER_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(USER_STORE_NAME, 'readonly');
    const store = transaction.objectStore(USER_STORE_NAME);
    const request = store.get(email);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

export async function addUser(user: User): Promise<void> {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(USER_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(USER_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.add(user);
        request.onsuccess = () => resolve();
        // Handle constraint error for existing email
        request.onerror = () => {
             if (request.error?.name === 'ConstraintError') {
                reject(new Error(`User with email '${user.email}' already exists.`));
            } else {
                reject(request.error);
            }
        };
    });
}

export async function deleteUser(email: string): Promise<void> {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(USER_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(USER_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.delete(email);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
