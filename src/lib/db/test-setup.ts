import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// Make sure indexedDB is available globally for Dexie
if (typeof globalThis.indexedDB === 'undefined') {
	globalThis.indexedDB = new IDBFactory();
}
