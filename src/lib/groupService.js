import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc,
  arrayUnion, arrayRemove, query, where, onSnapshot, deleteField
} from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './utils';

const GROUPS_COL = 'groups';

/**
 * Create a new group in Firestore.
 * Returns the group object.
 */
export async function createGroup(name, password, user) {
  const groupId = generateId();
  const member = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || null,
    status: 'online',
    joinedAt: new Date().toISOString(),
  };
  const group = {
    id: groupId,
    name,
    password,
    members: [member],
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, GROUPS_COL, groupId), group);
  return group;
}

/**
 * Join an existing group by name + password.
 * Returns the group object if credentials match, or throws an error.
 */
export async function joinGroup(name, password, user) {
  const q = query(collection(db, GROUPS_COL), where('name', '==', name));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('Group not found. Check the name and try again.');
  }

  const groupDoc = snap.docs[0];
  const groupData = groupDoc.data();

  if (groupData.password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }

  // Check if user is already a member
  const alreadyMember = (groupData.members || []).some(m => m.id === user.id);
  if (!alreadyMember) {
    const member = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      status: 'online',
      joinedAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, GROUPS_COL, groupData.id), {
      members: arrayUnion(member),
    });
    groupData.members = [...(groupData.members || []), member];
  } else {
    // Update status to online
    const updatedMembers = groupData.members.map(m =>
      m.id === user.id ? { ...m, status: 'online' } : m
    );
    await updateDoc(doc(db, GROUPS_COL, groupData.id), {
      members: updatedMembers,
    });
    groupData.members = updatedMembers;
  }

  return groupData;
}

/**
 * Leave a group — remove user from members array.
 */
export async function leaveGroup(groupId, userId) {
  const groupRef = doc(db, GROUPS_COL, groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const updatedMembers = (data.members || []).filter(m => m.id !== userId);
  await updateDoc(groupRef, { members: updatedMembers });
}

/**
 * Update a user's status in a group.
 */
export async function updateMemberStatus(groupId, userId, status) {
  const groupRef = doc(db, GROUPS_COL, groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const updatedMembers = (data.members || []).map(m =>
    m.id === userId ? { ...m, status } : m
  );
  await updateDoc(groupRef, { members: updatedMembers });
}

/**
 * Fetch all available groups (for browsing).
 * Returns an array of { id, name, memberCount, createdAt }.
 */
export async function fetchAllGroups() {
  const snap = await getDocs(collection(db, GROUPS_COL));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: data.id,
      name: data.name,
      memberCount: (data.members || []).length,
      members: data.members || [],
      createdAt: data.createdAt,
    };
  });
}

/**
 * Subscribe to a group's realtime changes (members joining/leaving, etc).
 * Returns an unsubscribe function.
 */
export function subscribeToGroup(groupId, callback) {
  const groupRef = doc(db, GROUPS_COL, groupId);
  return onSnapshot(groupRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    }
  });
}

/**
 * Get a group by ID.
 */
export async function getGroupById(groupId) {
  const snap = await getDoc(doc(db, GROUPS_COL, groupId));
  if (!snap.exists()) return null;
  return snap.data();
}
