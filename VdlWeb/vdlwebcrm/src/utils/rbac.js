export const ROLES = {
  ADMIN: 1,
  INTERNAL: 2,
  EXTERNAL: 3,
  STUDENT: 4
};

export const DEFAULT_PERMISSIONS = {
  settings_page: { roles: [ROLES.ADMIN], specific_users: [] },
  unlock_action: { roles: [ROLES.ADMIN] },
  bulk_assign: { roles: [ROLES.ADMIN] },
  add_new_row: { roles: [ROLES.ADMIN] }
};

export const getPermissions = () => {
  try {
    const stored = localStorage.getItem('vdl_permissions');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Error reading permissions", e);
  }
  return DEFAULT_PERMISSIONS;
};

export const savePermissions = (perms) => {
  localStorage.setItem('vdl_permissions', JSON.stringify(perms));
};

export const getCurrentUser = () => {
  try {
    
    const stored = localStorage.getItem('user_info'); // Changed from 'vdl_user' to 'user_info'
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return null; 
};

export const hasPermission = (user, actionKey) => {
  if (!user) return false;
  if (Number(user.roleId) === ROLES.ADMIN) return true; // Admin always has access

  const perms = getPermissions();
  const actionPerms = perms[actionKey];
  if (!actionPerms) return false;

  if (actionPerms.roles && actionPerms.roles.includes(Number(user.roleId))) {
    // Check if specific user mapping is defined for this action
    if (actionPerms.specific_users && actionPerms.specific_users.length > 0) {
      return actionPerms.specific_users.includes(String(user.id));
    }
    return true;
  }
  return false;
};

export const canAccessPage = (user, page) => {
  if (!user) return false;
  if (Number(user.roleId) === ROLES.ADMIN) return true; // Admin always has access

  if (Number(user.roleId) === ROLES.STUDENT) {
    const allowedForStudent = ['studentDetails', 'seats', 'identityCards'];
    return allowedForStudent.includes(page);
  }

  if (page === 'settings') return hasPermission(user, 'settings_page');
  return true; // Other pages open or add logic here
};

// Helper to check if a student's profile is complete based on essential fields
export const isStudentProfileComplete = (userId) => {
  if (!userId) return false;
  const savedProfile = localStorage.getItem(`vdl_profile_${userId}`);
  if (savedProfile) {
    const parsedData = JSON.parse(savedProfile);
    return !!parsedData.name && !!parsedData.mobileNumber && !!parsedData.address; // Check for essential fields
  }
  return false;
};