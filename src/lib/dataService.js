import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc,
  deleteDoc, onSnapshot, query, orderBy, addDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { generateId } from './utils';

/**
 * Upload a file as a base64 string to be stored directly in Firestore.
 * Note: Firestore has a strict 1MB document size limit. 
 * Base64 adds ~33% overhead, so the raw file must be under ~750KB.
 * Returns { url, storagePath, fileName, fileSize, fileType }.
 */
export async function uploadResourceFile(groupId, file, onProgress) {
  return new Promise((resolve, reject) => {
    if (onProgress) onProgress(10);
    
    // Set limit slightly under 750KB to safely fit within 1MB after Base64 encoding
    const MAX_SIZE = 750 * 1024;
    if (file.size > MAX_SIZE) {
      return reject(new Error(`File is too large (${(file.size/1024).toFixed(1)}KB). Maximum size for the free database is 750KB. For larger files, please use Links.`));
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      if (onProgress) onProgress(100);
      resolve({
        url: reader.result, // Data URL (base64)
        storagePath: null, // No storage path needed
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    
    reader.readAsDataURL(file);
  });
}

/**
 * Delete a file from Firebase Storage (No-op now since we use base64).
 */
export async function deleteStorageFile(storagePath) {
  if (!storagePath) return;
}

/**
 * Helper: Get a sub-collection path under a group.
 */
function groupCol(groupId, subCollection) {
  return collection(db, 'groups', groupId, subCollection);
}

function groupDocRef(groupId, subCollection, docId) {
  return doc(db, 'groups', groupId, subCollection, docId);
}

/* ── TASKS ── */

export async function saveTask(groupId, task) {
  const id = task.id || generateId();
  await setDoc(groupDocRef(groupId, 'tasks', id), { ...task, id });
  return { ...task, id };
}

export async function deleteTask(groupId, taskId) {
  await deleteDoc(groupDocRef(groupId, 'tasks', taskId));
}

export async function updateTaskDoc(groupId, taskId, updates) {
  await updateDoc(groupDocRef(groupId, 'tasks', taskId), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export function subscribeTasks(groupId, callback) {
  return onSnapshot(groupCol(groupId, 'tasks'), (snap) => {
    const tasks = snap.docs.map(d => d.data());
    callback(tasks);
  });
}

/* ── EVENTS (Calendar) ── */

export async function saveEvent(groupId, event) {
  const id = event.id || generateId();
  await setDoc(groupDocRef(groupId, 'events', id), { ...event, id });
  return { ...event, id };
}

export async function deleteEvent(groupId, eventId) {
  await deleteDoc(groupDocRef(groupId, 'events', eventId));
}

export function subscribeEvents(groupId, callback) {
  return onSnapshot(groupCol(groupId, 'events'), (snap) => {
    const events = snap.docs.map(d => d.data());
    callback(events);
  });
}

/* ── NOTES ── */

export async function saveNote(groupId, note) {
  const id = note.id || generateId();
  await setDoc(groupDocRef(groupId, 'notes', id), { ...note, id });
  return { ...note, id };
}

export async function deleteNote(groupId, noteId) {
  await deleteDoc(groupDocRef(groupId, 'notes', noteId));
}

export async function updateNoteDoc(groupId, noteId, updates) {
  await updateDoc(groupDocRef(groupId, 'notes', noteId), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export function subscribeNotes(groupId, callback) {
  return onSnapshot(groupCol(groupId, 'notes'), (snap) => {
    const notes = snap.docs.map(d => d.data());
    callback(notes);
  });
}

/* ── NOTE FOLDERS ── */

export async function saveNoteFolder(groupId, folder) {
  const id = folder.id || generateId();
  await setDoc(groupDocRef(groupId, 'noteFolders', id), { ...folder, id });
  return { ...folder, id };
}

export async function deleteNoteFolder(groupId, folderId) {
  await deleteDoc(groupDocRef(groupId, 'noteFolders', folderId));
}

export async function saveResourceFolder(groupId, folder) {
  const id = folder.id || generateId();
  await setDoc(groupDocRef(groupId, 'resourceFolders', id), { ...folder, id });
  return { ...folder, id };
}

export async function deleteResourceFolder(groupId, folderId) {
  await deleteDoc(groupDocRef(groupId, 'resourceFolders', folderId));
}

export function subscribeNoteFolders(groupId, callback) {
  return onSnapshot(groupCol(groupId, 'noteFolders'), (snap) => {
    const folders = snap.docs.map(d => d.data());
    callback(folders);
  });
}

export function subscribeResourceFolders(groupId, callback) {
  return onSnapshot(groupCol(groupId, 'resourceFolders'), (snap) => {
    const folders = snap.docs.map(d => d.data());
    callback(folders);
  });
}

/* ── CHAT CHANNELS ── */

export async function saveChannel(groupId, channel) {
  const id = channel.id || generateId();
  await setDoc(groupDocRef(groupId, 'channels', id), { ...channel, id });
  return { ...channel, id };
}

export function subscribeChannels(groupId, callback) {
  return onSnapshot(groupCol(groupId, 'channels'), (snap) => {
    const channels = snap.docs.map(d => d.data());
    callback(channels);
  });
}

/* ── CHAT MESSAGES ── */

export async function saveMessage(groupId, message) {
  const id = message.id || generateId();
  await setDoc(groupDocRef(groupId, 'messages', id), { ...message, id });
  return { ...message, id };
}

export function subscribeMessages(groupId, callback) {
  return onSnapshot(groupCol(groupId, 'messages'), (snap) => {
    const messages = snap.docs.map(d => d.data());
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    callback(messages);
  });
}

/* ── ACTIVITIES ── */

export async function saveActivity(groupId, activity) {
  const id = activity.id || generateId();
  await setDoc(groupDocRef(groupId, 'activities', id), { ...activity, id });
  return { ...activity, id };
}

export function subscribeActivities(groupId, callback) {
  return onSnapshot(groupCol(groupId, 'activities'), (snap) => {
    const activities = snap.docs.map(d => d.data());
    activities.sort((a, b) => new Date(b.at) - new Date(a.at));
    callback(activities);
  });
}

/* ── RESOURCES ── */

export async function saveResource(groupId, resource) {
  const id = resource.id || generateId();
  await setDoc(groupDocRef(groupId, 'resources', id), { ...resource, id });
  return { ...resource, id };
}

export async function deleteResource(groupId, resourceId) {
  await deleteDoc(groupDocRef(groupId, 'resources', resourceId));
}

export function subscribeResources(groupId, callback) {
  return onSnapshot(groupCol(groupId, 'resources'), (snap) => {
    const resources = snap.docs.map(d => d.data());
    callback(resources);
  });
}

/**
 * Initialize default channels for a new group.
 */
export async function initGroupDefaults(groupId) {
  // Create default chat channels
  const defaultChannels = [
    { id: 'ch_general', name: 'general', unread: 0 },
    { id: 'ch_random', name: 'random', unread: 0 },
  ];
  for (const ch of defaultChannels) {
    await saveChannel(groupId, ch);
  }

  // Create default note folder
  await saveNoteFolder(groupId, { id: 'nf_general', name: 'General' });

  // Create default resource folder
  await saveResourceFolder(groupId, { id: 'rf_general', name: 'General' });
}
