import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  query, 
  orderByChild 
} from 'firebase/database';
import { db, auth } from '../Firebase';
import { useNavigate } from 'react-router-dom';

const userService = {
  // Updated createUser function
async createUser(userData, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);

    const firestoreData = {
      uid: userCredential.user.uid,
      email: userData.email,
      fullName: userData.fullName,
      position: userData.position || "",
      role: userData.position === "Admin" ? "admin" : "user", // Add role field
      department: userData.department || "",
      createdAt: new Date().toISOString(),
      createdBy: userData.createdBy || "system"
    };

    const userRef = ref(db, 'users/' + userCredential.user.uid);
    await set(userRef, firestoreData);

    return {
      id: userCredential.user.uid,
      ...firestoreData,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
},

async updateUserPassword(userId, newPassword) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user && user.uid === userId) {
      // Can only update current user's password from client-side
      await user.updatePassword(newPassword);
      return true;
    } else {
      // For updating other users' passwords, you'd need Firebase Admin SDK on server
      throw new Error("Password updates for other users require server-side implementation");
    }
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
},

// Updated updateUser function
async updateUser(userId, userData) {
  try {
    const userRef = ref(db, 'users/' + userId);
    const updateData = {
      ...userData,
      role: userData.position === "Admin" ? "admin" : "user", // Update role field
      updatedAt: new Date().toISOString()
    };
    await update(userRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
},

  async deleteUser(userId) {
    try {
      const userRef = ref(db, 'users/' + userId);
      await remove(userRef);
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  async fetchUsers() {
    try {
      const usersRef = ref(db, 'users');
      try {
        const usersQuery = query(usersRef, orderByChild("createdAt"));
        const snapshot = await get(usersQuery);
        
        if (!snapshot.exists()) return [];
        const usersList = [];
        snapshot.forEach(childSnapshot => {
          usersList.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });
        
        return usersList;
      } catch (indexError) {
        console.warn("Ordered query failed, falling back to unordered fetch:", indexError.message);
        
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) return [];
        
        const usersList = [];
        snapshot.forEach(childSnapshot => {
          usersList.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });
        return usersList.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },
  

  async getCurrentUserData(userId) {
    try {
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      console.error("Error fetching current user data:", error);
      throw error;
    }
  }
};

const UsersPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [users, setUsers] = useState([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [pinError, setPinError] = useState('');
  const ADMIN_PIN = '531870';
  const [formData, setFormData] = useState({
  
    email: '',
    password: '',
    fullName: '',
    position: 'User',
    department: 'IDT'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState(false);
  
  const departmentOptions = ["IDT", "Operations", "Logistics", "Finance", "Group Commander", "52nd CMOU"];
  
  const pendingOperationRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  }, []);

  const fetchUsers = useCallback(async (showLoading = false) => {
    if (!isAuthorized) return;
    
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const usersList = await userService.fetchUsers();
      setUsers(usersList);
    } catch (err) {
      showNotification("Failed to fetch users: " + err.message, "error");
      console.error("Fetch users error:", err);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [showNotification, isAuthorized]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (isAuthorized) {
      // Initial fetch with loading indicator
      fetchUsers(true);
      
      // Set up interval for auto-refresh (without loading indicator)
      refreshIntervalRef.current = setInterval(() => {
        fetchUsers(false);
      }, 10000); // 10 seconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isAuthorized, fetchUsers]);

  useEffect(() => {
    if (!db || !auth) {
      showNotification("Firebase initialization error", "error");
      console.error("Firebase not initialized properly");
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthChecking(true);
      
      if (user) {
        try {
          const userData = await userService.getCurrentUserData(user.uid);
          setCurrentUserData(userData);
          if (userData && userData.position === "Admin") {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            setRedirectMessage(true);
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          }
        } catch (error) {
          console.error("Error checking authorization:", error);
          showNotification("Error checking authorization", "error");
          setRedirectMessage(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } else {
        navigate('/login');
      }
      
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, [navigate, showNotification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) {
      showNotification("Required fields missing", "error");
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const operationId = Date.now();
      pendingOperationRef.current = operationId;
      
      const newUser = await userService.createUser({
        email: formData.email,
        fullName: formData.fullName,
        position: formData.position || "User",
        department: formData.department || "IDT",
        createdBy: currentUser ? currentUser.uid : "system"
      }, formData.password);
      
      if (pendingOperationRef.current !== operationId) return;
      
      setUsers(prev => [newUser, ...prev]);
      showNotification("User created successfully!", "success");
      
      setFormData({
        email: '',
        password: '',
        fullName: '',
        position: 'User',
        department: 'IDT' 
      });
    } catch (err) {
      console.error("Create user error:", err);
      showNotification("Error creating user: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

const handleUpdateUser = async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    const updatedData = {
      fullName: formData.fullName,
      position: formData.position,
      department: formData.department,
      updatedBy: currentUser ? currentUser.uid : "system"
    };
    
    await userService.updateUser(currentUserId, updatedData);
    
    // Handle password update if provided
    if (formData.password && formData.password.trim() !== '') {
      try {
        // Note: This will only work for the current user due to Firebase security rules
        // For other users, you'd need server-side implementation
        if (currentUserId === currentUser?.uid) {
          await userService.updateUserPassword(currentUserId, formData.password);
          showNotification("User and password updated successfully!", "success");
        } else {
          showNotification("User updated successfully! Note: Password updates for other users require server-side implementation.", "warning");
        }
      } catch (passwordError) {
        console.error("Password update error:", passwordError);
        showNotification("User updated successfully, but password update failed: " + passwordError.message, "warning");
      }
    } else {
      showNotification("User updated successfully!", "success");
    }
    
    setUsers(prev => prev.map(user => 
      user.id === currentUserId ? { 
        ...user, 
        ...updatedData,
        updatedAt: new Date().toISOString()
      } : user
    ));

    setIsEditing(false);
    setCurrentUserId(null);
    
    setFormData({
      email: '',
      password: '',
      fullName: '',
      position: 'User',
      department: 'IDT'
    });
  } catch (err) {
    console.error("Update user error:", err);
    showNotification("Error updating user: " + err.message, "error");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleEdit = (user) => {
    setFormData({
      email: user.email,
      password: '', 
      fullName: user.fullName,
      position: user.position || "User",
      department: departmentOptions.includes(user.department) ? user.department : "IDT"
    });
    setCurrentUserId(user.id);
    setIsEditing(true);
  };

const handleDelete = (userId, userName) => {
  setUserToDelete({ id: userId, name: userName });
  setShowPinModal(true);
  setPinCode('');
  setPinError('');
};

const handlePinSubmit = async () => {
  if (pinCode !== ADMIN_PIN) {
    setPinError('Invalid PIN code');
    return;
  }

  setIsLoading(true);
  try {
    await userService.deleteUser(userToDelete.id);
    setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
    
    // Close modal first
    setShowPinModal(false);
    setUserToDelete(null);
    setPinCode('');
    setPinError('');

    showNotification("User deleted successfully!", "success");
  } catch (err) {
    console.error("Delete user error:", err);
    
    setShowPinModal(false);
    setUserToDelete(null);
    setPinCode('');
    setPinError('');
    
    showNotification("Error deleting user: " + err.message, "error");
  } finally {
    setIsLoading(false);
  }
};
const handlePinCancel = () => {
  setShowPinModal(false);
  setUserToDelete(null);
  setPinCode('');
  setPinError('');
};

const handlePinChange = (e) => {
  const value = e.target.value.replace(/\D/g, ''); // Only allow digits
  if (value.length <= 6) {
    setPinCode(value);
    setPinError(''); // Clear error when user types
  }
};

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentUserId(null);
    setFormData({
      email: '',
      password: '',
      fullName: '',
      position: 'User',
      department: 'IDT'
    });
  };

  if (isAuthChecking) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <svg className="inline animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-gray-600">Verifying access privileges...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (redirectMessage) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center max-w-md p-8 bg-red-50 rounded-lg shadow-lg border border-red-200">
            <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-red-700 mb-3">Access Denied</h2>
            <p className="text-gray-700 mb-4">You do not have the necessary administrator privileges to access this page.</p>
            <p className="text-gray-500 text-sm">Redirecting to dashboard in a few seconds...</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-red-600 h-2.5 rounded-full animate-[loading_3s_ease-in-out]"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-900">User Management</h1>
          {currentUserData && (
            <p className="text-sm text-gray-600 mt-1">
              Logged in as: {currentUserData.fullName} ({currentUserData.position})
            </p>
          )}
        </div>

        {notification.show && (
          <div className={`mb-4 p-4 rounded-md ${
            notification.type === "success" 
              ? "bg-green-100 border-green-400 text-green-700" 
              : "bg-red-100 border-red-400 text-red-700"
          } border px-4 py-3 relative`}>
            <span className="block sm:inline">{notification.message}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? 'Edit User' : 'Create New User'}
          </h2>
          
          <form onSubmit={isEditing ? handleUpdateUser : handleCreateUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isEditing}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                autoComplete="email"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password {isEditing ? "(leave blank to keep current)" : "*"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required={!isEditing}
                  minLength="6"
                  autoComplete={isEditing ? "current-password" : "new-password"}
                  placeholder={isEditing ? "Enter new password to change" : ""}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  autoComplete="name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="position">
                  User Type *
                </label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="department">
                  Department *
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  {departmentOptions.map(department => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${isSubmitting ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out`}
              >
                {isSubmitting ? "Processing..." : (isEditing ? 'Update User' : 'Create User')}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Users List ({users.length})</h2>
            <div className="text-sm text-gray-500">
              Auto-refreshes every 10 seconds
            </div>
          </div>
          {/* PIN Verification Modal - ADD IT HERE */}
          {showPinModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
                <div className="text-center mb-6">
                  <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Confirm User Deletion
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You are about to delete user: <span className="font-semibold">{userToDelete?.name}</span>
                  </p>
                  <p className="text-gray-600 mb-4">
                    Enter your 6-digit admin PIN to confirm this action.
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Admin PIN
                  </label>
                  <input
                    type="password"
                    value={pinCode}
                    onChange={handlePinChange}
                    className={`w-full px-3 py-2 border rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 ${
                      pinError 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="••••••"
                    maxLength="6"
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-red-500 text-sm mt-2 text-center">{pinError}</p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handlePinCancel}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePinSubmit}
                    disabled={pinCode.length !== 6 || isLoading}
                    className={`flex-1 font-bold py-2 px-4 rounded transition duration-150 ease-in-out ${
                      pinCode.length === 6 && !isLoading
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? 'Deleting...' : 'Delete User'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {isLoading && users.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Position</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Department</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Created</th>
                    <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-blue-50">
                      <td className="py-3 px-4">{user.fullName}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{user.position}</td>
                      <td className="py-3 px-4">{user.department}</td>
                      <td className="py-3 px-4">
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString() 
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit User"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.fullName)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete User"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UsersPage;