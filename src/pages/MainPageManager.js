import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import bgdefault from '../assets/bg-landing.jpg';
import { firestore, storage } from '../Firebase';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, 
  orderBy, limit, where, setDoc 
} from 'firebase/firestore';
import { 
  ref as storageRef, uploadBytes, getDownloadURL, deleteObject 
} from 'firebase/storage';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600 text-white';
      case 'error':
        return 'bg-red-500 border-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600 text-white';
      case 'info':
        return 'bg-blue-500 border-blue-600 text-white';
      default:
        return 'bg-gray-500 border-gray-600 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 border-l-4 p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${getToastStyles()} max-w-md`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl mr-3">{getIcon()}</span>
          <span className="font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 font-bold text-lg"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel", type = "danger" }) => {
  if (!isOpen) return null;

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '🗑️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <span className="text-3xl">{getIcon()}</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-gray-600">
              {message}
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${getConfirmButtonStyles()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainPageManager = () => {
  const [mainPageData, setMainPageData] = useState(null);
  const [activeConfiguration, setActiveConfiguration] = useState(null);
  const [allConfigurations, setAllConfigurations] = useState([]);
  const [defaultConfiguration, setDefaultConfiguration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    backgroundImage: null,
    subtitle: '',
    startDate: '',
    endDate: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDefault, setIsEditingDefault] = useState(false);
  const [currentPageId, setCurrentPageId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); // Toast state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  const fallbackDefaultConfig = {
    subtitle: "Building bridges between communities and fostering meaningful relationships through service and dedication.",
    backgroundImageURL: bgdefault,
    isDefault: true
  };
  const getConfigurationStatus = (config) => {
  const now = new Date();
  const startDate = new Date(config.startDate);
  const endDate = new Date(config.endDate);
    
    if (now < startDate) {
      return { status: 'Scheduled', color: 'blue' };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'Active', color: 'green' };
    } else {
      return { status: 'Expired', color: 'gray' };
    }
  };

  useEffect(() => {
    const fetchMainPageData = async () => {
      try {
        setError(null);
        const mainPageCollection = collection(firestore, 'mainPage');
        const mainPageQuery = query(mainPageCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(mainPageQuery);
        
        const configurations = [];
        let defaultConfig = null;
        
        snapshot.forEach(doc => {
          const data = { id: doc.id, ...doc.data() };
          if (data.isDefault) {
            defaultConfig = data;
          } else {
            configurations.push(data);
          }
        });
        
        setAllConfigurations(configurations);
        
        // If no default config exists in database, create one
        if (!defaultConfig) {
          const defaultDocRef = doc(firestore, 'mainPage', 'default');
          const defaultData = {
            ...fallbackDefaultConfig,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(defaultDocRef, defaultData);
          defaultConfig = { id: 'default', ...defaultData };
        }
        
        setDefaultConfiguration(defaultConfig);
    
        const now = new Date();
        const activeConfig = configurations.find(config => {
          if (!config.startDate || !config.endDate) return false;
          const startDate = new Date(config.startDate);
          const endDate = new Date(config.endDate);
          return now >= startDate && now <= endDate;
        });
        
        if (activeConfig) {
          setActiveConfiguration(activeConfig);
          setMainPageData(activeConfig);
        } else {
          setActiveConfiguration(defaultConfig);
          setMainPageData(defaultConfig);
        }
      } catch (error) {
        console.error("Error fetching main page data:", error);
        setError("Failed to load main page data. Please check your Firebase configuration.");
        setDefaultConfiguration(fallbackDefaultConfig);
        setActiveConfiguration(fallbackDefaultConfig);
        setMainPageData(fallbackDefaultConfig);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMainPageData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const activeConfig = allConfigurations.find(config => {
        if (!config.startDate || !config.endDate) return false;
        const startDate = new Date(config.startDate);
        const endDate = new Date(config.endDate);
        return now >= startDate && now <= endDate;
      });
      
      if (activeConfig && activeConfig.id !== activeConfiguration?.id) {
        setActiveConfiguration(activeConfig);
        setMainPageData(activeConfig);
      } else if (!activeConfig && !activeConfiguration?.isDefault) {
        setActiveConfiguration(defaultConfiguration);
        setMainPageData(defaultConfiguration);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [allConfigurations, activeConfiguration, defaultConfiguration]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        backgroundImage: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.onerror = () => {
        alert('Error reading file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadBackgroundImage = async (file, pageId) => {
    if (!file) return null;
    
    try {
      setUploadProgress(10);
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const fileRef = storageRef(storage, `main-page-backgrounds/${pageId}/${fileName}`);
      
      setUploadProgress(50);
      await uploadBytes(fileRef, file);
      
      setUploadProgress(80);
      const downloadURL = await getDownloadURL(fileRef);
      setUploadProgress(100);
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading background image:", error);
      setUploadProgress(0);
      throw new Error("Failed to upload image. Please try again.");
    }
  };

  const deleteOldImage = async (imageURL) => {
    if (!imageURL || imageURL.includes('unsplash.com') || imageURL === bgdefault) return;
    
    try {
      const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
      if (imageURL.includes(baseUrl)) {
        const pathStart = imageURL.indexOf('/o/') + 3;
        const pathEnd = imageURL.indexOf('?');
        if (pathStart > 2 && pathEnd > pathStart) {
          const imagePath = decodeURIComponent(imageURL.substring(pathStart, pathEnd));
          const fileRef = storageRef(storage, imagePath);
          await deleteObject(fileRef);
        }
      }
    } catch (error) {
      console.error("Error deleting old image:", error);
    }
  };

  const validateDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (start >= end) {
      throw new Error("End date must be after start date.");
    }
    
    if (end <= now) {
      throw new Error("End date must be in the future.");
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);
    setError(null);

    try {
      let pageId = currentPageId;
      let backgroundImageURL = null;
      
      if (isEditingDefault) {
        // Update default configuration
        const pageData = {
          subtitle: formData.subtitle.trim(),
          backgroundImageURL: defaultConfiguration.backgroundImageURL,
          isDefault: true,
          updatedAt: new Date().toISOString()
        };
        
        const oldImageURL = defaultConfiguration.backgroundImageURL;
        
        if (formData.backgroundImage && formData.backgroundImage instanceof File) {
          backgroundImageURL = await uploadBackgroundImage(formData.backgroundImage, 'default');
          pageData.backgroundImageURL = backgroundImageURL;
          
          if (oldImageURL && oldImageURL !== backgroundImageURL && oldImageURL !== bgdefault) {
            await deleteOldImage(oldImageURL);
          }
        } else if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('https://')) {
          pageData.backgroundImageURL = imagePreview;
        }
        
        await updateDoc(doc(firestore, 'mainPage', 'default'), pageData);
        
        const updatedDefaultConfig = { id: 'default', ...pageData };
        setDefaultConfiguration(updatedDefaultConfig);
        
        // If default is currently active, update the active configuration
        if (activeConfiguration?.isDefault) {
          setActiveConfiguration(updatedDefaultConfig);
          setMainPageData(updatedDefaultConfig);
        }
        
        alert("Default configuration updated successfully!");
      } else {
        // Validate dates for scheduled configurations
        validateDates(formData.startDate, formData.endDate);
        
        const pageData = {
          subtitle: formData.subtitle.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate,
          updatedAt: new Date().toISOString(),
          isActive: false,
          isDefault: false
        };

        if (!isEditing) {
          // Create new main page configuration
          pageData.createdAt = new Date().toISOString();
          const docRef = await addDoc(collection(firestore, 'mainPage'), pageData);
          pageId = docRef.id;
          
          if (formData.backgroundImage && formData.backgroundImage instanceof File) {
            backgroundImageURL = await uploadBackgroundImage(formData.backgroundImage, pageId);
            if (backgroundImageURL) {
              await updateDoc(doc(firestore, 'mainPage', pageId), {
                backgroundImageURL: backgroundImageURL
              });
            }
          }
          
          const updatedPageData = {
            id: pageId,
            ...pageData,
            backgroundImageURL: backgroundImageURL
          };
          
          // Update configurations list
          setAllConfigurations(prev => [updatedPageData, ...prev]);
          
          // Check if this new configuration should be active now
          const now = new Date();
          const startDate = new Date(formData.startDate);
          const endDate = new Date(formData.endDate);
          
          if (now >= startDate && now <= endDate) {
            setActiveConfiguration(updatedPageData);
            setMainPageData(updatedPageData);
          }
        } else {
          // Update existing main page configuration
          const oldConfig = allConfigurations.find(config => config.id === pageId);
          const oldImageURL = oldConfig?.backgroundImageURL;
          
          if (formData.backgroundImage && formData.backgroundImage instanceof File) {
            backgroundImageURL = await uploadBackgroundImage(formData.backgroundImage, pageId);
            pageData.backgroundImageURL = backgroundImageURL;
            
            if (oldImageURL && oldImageURL !== backgroundImageURL) {
              await deleteOldImage(oldImageURL);
            }
          } else if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('https://')) {
            pageData.backgroundImageURL = imagePreview;
          }
          
          await updateDoc(doc(firestore, 'mainPage', pageId), pageData);
          
          const updatedConfig = { ...oldConfig, ...pageData };
          
          // Update configurations list
          setAllConfigurations(prev => 
            prev.map(config => config.id === pageId ? updatedConfig : config)
          );
          
          // Check if this updated configuration should be active now
          const now = new Date();
          const startDate = new Date(formData.startDate);
          const endDate = new Date(formData.endDate);
          
          if (now >= startDate && now <= endDate) {
            setActiveConfiguration(updatedConfig);
            setMainPageData(updatedConfig);
          } else if (activeConfiguration?.id === pageId) {
            setActiveConfiguration(defaultConfiguration);
            setMainPageData(defaultConfiguration);
          }
        }
        
        alert("Configuration saved successfully!");
      }
      
      resetForm();
    } catch (error) {
      console.error("Error saving configuration:", error);
      setError(error.message || "Failed to save configuration. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      backgroundImage: null,
      subtitle: '',
      startDate: '',
      endDate: ''
    });
    setImagePreview(null);
    setShowForm(false);
    setIsEditing(false);
    setIsEditingDefault(false);
    setCurrentPageId(null);
    setUploadProgress(0);
    setError(null);
  };

  const handleEditDefault = () => {
    setFormData({
      backgroundImage: null,
      subtitle: defaultConfiguration?.subtitle || '',
      startDate: '',
      endDate: ''
    });
    
    if (defaultConfiguration?.backgroundImageURL) {
      setImagePreview(defaultConfiguration.backgroundImageURL);
    }
    
    setIsEditingDefault(true);
    setShowForm(true);
    setError(null);
  };

  const handleEditMainPage = (config) => {
    setCurrentPageId(config.id);
    setFormData({
      backgroundImage: null,
      subtitle: config.subtitle || '',
      startDate: config.startDate || '',
      endDate: config.endDate || ''
    });
    
    if (config.backgroundImageURL) {
      setImagePreview(config.backgroundImageURL);
    }
    
    setIsEditing(true);
    setShowForm(true);
    setError(null);
  };

  const handleDeleteMainPage = async (config) => {
    showConfirmModal(
      "Delete Configuration",
      "Are you sure you want to delete this configuration? This action cannot be undone.",
      async () => {
        setLoading(true);
        setError(null);

        try {
          await deleteDoc(doc(firestore, 'mainPage', config.id));
          
          if (config.backgroundImageURL) {
            await deleteOldImage(config.backgroundImageURL);
          }
          
          // Update configurations list
          setAllConfigurations(prev => prev.filter(c => c.id !== config.id));
          
          // If this was the active configuration, switch to default or find another active one
          if (activeConfiguration?.id === config.id) {
            const now = new Date();
            const newActiveConfig = allConfigurations
              .filter(c => c.id !== config.id)
              .find(c => {
                if (!c.startDate || !c.endDate) return false;
                const startDate = new Date(c.startDate);
                const endDate = new Date(c.endDate);
                return now >= startDate && now <= endDate;
              });
            
            if (newActiveConfig) {
              setActiveConfiguration(newActiveConfig);
              setMainPageData(newActiveConfig);
            } else {
              setActiveConfiguration(defaultConfiguration);
              setMainPageData(defaultConfiguration);
            }
          }
          
          showToast("Configuration deleted successfully!", "success");
        } catch (error) {
          console.error("Error deleting configuration:", error);
          showToast("Failed to delete configuration. Please try again.", "error");
        } finally {
          setLoading(false);
          closeConfirmModal();
        }
      },
      "danger"
    );
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const showConfirmModal = (title, message, onConfirm, type = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      type: 'danger'
    });
  };

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Layout>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Main Page Manager</h1>
          <p className="text-gray-600">Schedule your main page appearance and content with date durations</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }} 
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <span className="mr-2">{showForm ? '✕' : '+'}</span>
          {showForm ? 'Create New Configuration' : 'Add New Configuration'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Currently Active Configuration */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-xl font-bold text-green-800 flex items-center">
            <span className="mr-2">🟢</span>
            Currently Active Configuration
          </h2>
          {activeConfiguration && (
            <button
              onClick={() => {
                if (activeConfiguration.isDefault) {
                  handleEditDefault();
                } else {
                  handleEditMainPage(activeConfiguration);
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <span className="mr-1">✏️</span>
              Edit Active Configuration
            </button>
          )}
        </div>
        {activeConfiguration ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Subtitle</h3>
                <p className="text-gray-600 bg-white p-3 rounded">{activeConfiguration.subtitle}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${activeConfiguration.isDefault ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                  {activeConfiguration.isDefault ? 'Default Configuration' : 'Scheduled Configuration'}
                </span>
              </div>
            </div>
            
            {!activeConfiguration.isDefault && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Active Period</h3>
                  <p className="text-gray-600">
                    {formatDate(activeConfiguration.startDate)} - {formatDate(activeConfiguration.endDate)}
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Background Image</h3>
              <div className="border rounded-lg overflow-hidden">
                <img 
                    src={activeConfiguration.backgroundImageURL || bgdefault} 
                    alt="Active background" 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                    e.target.src = bgdefault;
                    }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Loading active configuration...</p>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">
            {isEditingDefault ? 'Edit Default Configuration' : 
             isEditing ? 'Edit Configuration' : 'Create New Configuration'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Subtitle *</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                  placeholder="Your inspiring subtitle here..."
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.subtitle.length}/200 characters</p>
              </div>
              
              {!isEditingDefault && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Background Image {!isEditing && !isEditingDefault && '*'}
                </label>
                <div className="flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!isEditing && !isEditingDefault}
                    disabled={loading}
                  />
                  {imagePreview && (
                    <div className="ml-4">
                      <img src={imagePreview} alt="Background preview" className="h-16 w-24 object-cover rounded border" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG, GIF. Max size: 5MB</p>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-3">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Uploading: {Math.round(uploadProgress)}%</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || uploadProgress > 0}
              >
                {loading ? 'Saving...' : 
                 isEditingDefault ? 'Update Default Configuration' :
                 isEditing ? 'Update Configuration' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* All Configurations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">All Configurations</h2>
        {loading && !showForm ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading configurations...</p>
          </div>
        ) : allConfigurations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-500 mb-4">No scheduled configurations found.</p>
            <p className="text-sm text-gray-400 mb-4">Create your first scheduled configuration to get started!</p>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Create Your First Configuration
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {allConfigurations.map((config) => {
              const { status, color } = getConfigurationStatus(config);
              return (
                <div key={config.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">{config.subtitle}</h3>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${color === 'green' ? 'bg-green-100 text-green-800' : color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatDate(config.startDate)} - {formatDate(config.endDate)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {formatDate(config.createdAt)}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button 
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleEditMainPage(config)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDeleteMainPage(config)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {config.backgroundImageURL && (
                    <div className="mt-3">
                      <img 
                        src={config.backgroundImageURL} 
                        alt="Configuration background" 
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MainPageManager;