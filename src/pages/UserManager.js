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
import { db, auth } from '../Firebase'; // Import the initialized Firebase instances
import { useNavigate } from 'react-router-dom'; // Import navigate from React Router

// Create a service layer for Firebase operations
const userService = {
  async createUser(userData, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);

      const firestoreData = {
        uid: userCredential.user.uid,
        email: userData.email,
        fullName: userData.fullName,
        position: userData.position || "",
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

  async updateUser(userId, userData) {
    try {
      const userRef = ref(db, 'users/' + userId);
      await update(userRef, {
        ...userData,
        updatedAt: new Date().toISOString()
      });
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
      
      // Try to use the ordered query first
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
        // If ordering fails, fall back to getting all users without ordering
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
        
        // Sort the results manually after fetching
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

  // Add a function to get current user's data
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
  const navigate = useNavigate(); // Initialize navigate for redirection
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    position: 'User',
    department: 'IDT'  // Set default department to IDT
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
  const [usersCache, setUsersCache] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [redirectMessage, setRedirectMessage] = useState(false); // New state for showing redirect message
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Department options for the dropdown
  const departmentOptions = ["IDT", "Operations", "Logistics", "Finance", "Group Commander"];
  
  const pendingOperationRef = useRef(null);

  // Show notification helper
  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  }, []);

  // Check authentication state and authorization on component mount
  useEffect(() => {
    // Check if Firebase is initialized
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
          // Fetch the user's complete data including position
          const userData = await userService.getCurrentUserData(user.uid);
          setCurrentUserData(userData);
          
          // Check if user is an Admin
          if (userData && userData.position === "Admin") {
            setIsAuthorized(true);
            fetchUsers(true);
          } else {
            setIsAuthorized(false);
            // Show access denied message before redirect
            setRedirectMessage(true);
            // Delay redirect to allow user to see the message
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000); // Redirect after 3 seconds
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
        // No user is signed in, redirect to login
        navigate('/login');
      }
      
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, [navigate, showNotification]);

  // Optimized fetch users with caching
  const fetchUsers = useCallback(async (forceRefresh = false) => {
    if (!isAuthorized) return;
    
    const now = Date.now();
    if (
      !forceRefresh &&
      usersCache &&
      lastFetchTime &&
      now - lastFetchTime < CACHE_DURATION
    ) {
      setUsers(usersCache);
      return;
    }

    setIsLoading(true);
    try {
      const usersList = await userService.fetchUsers();
      setUsers(usersList);
      setUsersCache(usersList);
      setLastFetchTime(now);
    } catch (err) {
      showNotification("Failed to fetch users: " + err.message, "error");
      console.error("Fetch users error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [usersCache, lastFetchTime, showNotification, isAuthorized]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Create user function
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
        department: 'IDT'  // Reset to default department
      });
    } catch (err) {
      console.error("Create user error:", err);
      showNotification("Error creating user: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update user function
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
      
      setUsers(prev => prev.map(user => 
        user.id === currentUserId ? { 
          ...user, 
          ...updatedData,
          updatedAt: new Date().toISOString()
        } : user
      ));

      showNotification("User updated successfully!", "success");
      setIsEditing(false);
      setCurrentUserId(null);
      
      setFormData({
        email: '',
        password: '',
        fullName: '',
        position: 'User',
        department: 'IDT'  // Reset to default department
      });
    } catch (err) {
      console.error("Update user error:", err);
      showNotification("Error updating user: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit handler
  const handleEdit = (user) => {
    setFormData({
      email: user.email,
      password: '', 
      fullName: user.fullName,
      position: user.position || "User",
      // Use the user's department if it exists in our options, otherwise default to IDT
      department: departmentOptions.includes(user.department) ? user.department : "IDT"
    });
    setCurrentUserId(user.id);
    setIsEditing(true);
  };

  // Delete user function
  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setIsLoading(true);
      try {
        await userService.deleteUser(userId);
        setUsers(prev => prev.filter(user => user.id !== userId));
        showNotification("User deleted successfully!", "success");
      } catch (err) {
        console.error("Delete user error:", err);
        showNotification("Error deleting user: " + err.message, "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setCurrentUserId(null);
    setFormData({
      email: '',
      password: '',
      fullName: '',
      position: 'User',
      department: 'IDT'  // Reset to default department
    });
  };

  // Show loading screen while checking authentication
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

  // Show access denied message before redirecting
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

  // If not authorized, don't render the component content
  if (!isAuthorized) {
    return null; // We're already redirecting, so just return null
  }

  // Render the component
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

        {/* User Form */}
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

              {!isEditing && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                    Password *
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
                      autoComplete="new-password"
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
              )}

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

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Users List ({users.length})</h2>
            <button 
              onClick={() => fetchUsers(true)}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
          
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
                            onClick={() => handleDelete(user.id)}
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