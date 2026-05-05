import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, where, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './utils';

const GROUPS_COL = 'groups';

/** Admin email with full group delete powers */
export const ADMIN_EMAIL = 'nevilsanish@gmail.com';

/**
 * Check if a user is admin.
 */
export function isAdmin(user) {
  return user?.email === ADMIN_EMAIL;
}

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
    isAdmin: true,
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
 *
 * FIX: Uses direct array write instead of arrayUnion to avoid
 * deduplication issues with complex objects.
 */
export async function joinGroup(name, password, user) {
  const q = query(collection(db, GROUPS_COL), where('name', '==', name));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('Group not found. Check the name and try again.');
  }

  const groupDoc = snap.docs[0];
  const groupRef = doc(db, GROUPS_COL, groupDoc.id);

  // Re-read latest data to avoid stale member lists
  const freshSnap = await getDoc(groupRef);
  const groupData = freshSnap.data();

  if (groupData.password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }

  const currentMembers = groupData.members || [];

  // Check if user is already a member (by id)
  const existingIndex = currentMembers.findIndex(m => m.id === user.id);

  let updatedMembers;
  if (existingIndex === -1) {
    // New member — append to array
    const newMember = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      status: 'online',
      joinedAt: new Date().toISOString(),
      isAdmin: false,
    };
    updatedMembers = [...currentMembers, newMember];
  } else {
    // Existing member — update status to online and refresh profile data
    updatedMembers = currentMembers.map(m =>
      m.id === user.id
        ? { ...m, name: user.name, email: user.email, avatar: user.avatar || null, status: 'online' }
        : m
    );
  }

  // Write the full array directly (not arrayUnion)
  await updateDoc(groupRef, { members: updatedMembers });

  return { ...groupData, members: updatedMembers };
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
 * Remove a member from the group (same underlying logic as leaveGroup).
 */
export const removeMember = leaveGroup;

/**
 * Promote a member to admin.
 */
export async function promoteToAdmin(groupId, userId) {
  const groupRef = doc(db, GROUPS_COL, groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const updatedMembers = (data.members || []).map(m =>
    m.id === userId ? { ...m, isAdmin: true } : m
  );
  await updateDoc(groupRef, { members: updatedMembers });
}

/**
 * Delete a group entirely (admin only).
 * Deletes the group document. Sub-collections (tasks, events, etc.)
 * will become orphaned but won't be accessible anymore.
 */
export async function deleteGroup(groupId) {
  await deleteDoc(doc(db, GROUPS_COL, groupId));
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
 * Returns an array of { id, name, memberCount, members, createdBy, createdAt }.
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
      createdBy: data.createdBy,
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
 * Fetch all groups where a given user is a member.
 * Returns an array of group objects.
 */
export async function getUserGroups(userId) {
  const snap = await getDocs(collection(db, GROUPS_COL));
  const groups = [];
  snap.docs.forEach(d => {
    const data = d.data();
    const members = data.members || [];
    if (members.some(m => m.id === userId)) {
      groups.push(data);
    }
  });
  return groups;
}

/**
 * Get a group by ID.
 */
export async function getGroupById(groupId) {
  const snap = await getDoc(doc(db, GROUPS_COL, groupId));
  if (!snap.exists()) return null;
  return snap.data();
}
