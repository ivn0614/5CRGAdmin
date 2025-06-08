import React, { useState, useEffect } from 'react';
import { firestore, storage } from '../Firebase';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query,
  orderBy, getDoc
} from 'firebase/firestore';
import {
  ref as storageRef, uploadBytes, getDownloadURL, deleteObject
} from 'firebase/storage';
import Layout from '../components/Layout';

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

const EducationalPage = () => {
  const [educationalContent, setEducationalContent] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
      title: '',
      category: '',
      content: '',
      publishDate: '',
      author: '',
      pictures: []
  });
  const [picturePreview, setPicturePreview] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContentId, setCurrentContentId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailContent, setDetailContent] = useState(null);
  const [toast, setToast] = useState(null); // Toast state
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      type: 'danger'
  });

  useEffect(() => {
      const fetchEducationalContent = async () => {
          try {
              const contentCollection = collection(firestore, 'educational');
              const contentQuery = query(contentCollection, orderBy('publishDate', 'desc'));
              const snapshot = await getDocs(contentQuery);

              const contentArray = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
              }));

              setEducationalContent(contentArray);
          } catch (error) {
              console.error("Error fetching educational content:", error);
          } finally {
              setLoading(false);
          }
      };

      fetchEducationalContent();
  }, []);

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData({
          ...formData,
          [name]: value
      });
  };

  const handlePicturesChange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
          setFormData({
              ...formData,
              pictures: [...formData.pictures, ...files]
          });
          files.forEach(file => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  setPicturePreview(prev => [...prev, reader.result]);
              };
              reader.readAsDataURL(file);
          });
      }
  };

  const removePicture = (index) => {
      const updatedPictures = [...formData.pictures];
      const updatedPreviews = [...picturePreview];
      updatedPictures.splice(index, 1);
      updatedPreviews.splice(index, 1);
      setFormData({
          ...formData,
          pictures: updatedPictures
      });
      setPicturePreview(updatedPreviews);
  };

  const uploadPictures = async (files, contentId) => {
      if (!files || files.length === 0) return [];

      const uploadedUrls = [];
      const totalFiles = files.length;
      let uploadedCount = 0;

      try {
          for (const file of files) {
              if (file instanceof File) {
                  const timestamp = new Date().getTime();
                  const fileName = `${timestamp}_${file.name}`;
                  const fileRef = storageRef(storage, `educational-images/${contentId}/${fileName}`);

                  await uploadBytes(fileRef, file);

                  const downloadURL = await getDownloadURL(fileRef);

                  uploadedUrls.push(downloadURL);
                  uploadedCount++;
                  setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
              } else if (typeof file === 'string' && file.startsWith('http')) {
                  uploadedUrls.push(file);
              }
          }

          return uploadedUrls;
      } catch (error) {
          console.error("Error uploading pictures:", error);
          throw error;
      }
  };

  const showToast = (message, type = 'success') => {
      setToast({ message, type });
  };

  const closeToast = () => {
      setToast(null);
  };

  // Confirmation modal helper functions
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

  const handleSubmit = async (e) => {
      e.preventDefault();

      setLoading(true);
      setUploadProgress(0);

      try {
          let contentId = currentContentId;
          let pictureURLs = [];

          const contentData = {
              title: formData.title,
              category: formData.category,
              content: formData.content,
              publishDate: formData.publishDate,
              author: formData.author,
              updatedAt: new Date().toISOString()
          };

          if (!isEditing) {
              contentData.createdAt = new Date().toISOString();

              const docRef = await addDoc(collection(firestore, 'educational'), contentData);
              contentId = docRef.id;
              if (formData.pictures && formData.pictures.length > 0) {
                  pictureURLs = await uploadPictures(formData.pictures, contentId);
                  if (pictureURLs.length > 0) {
                      await updateDoc(doc(firestore, 'educational', contentId), {
                          pictureURLs: pictureURLs
                      });
                  }
              }
              const updatedContent = {
                  id: contentId,
                  ...contentData,
                  pictureURLs: pictureURLs
              };

              setEducationalContent([updatedContent, ...educationalContent]);
              showToast("Educational content saved successfully!", "success");
          }
          else {
              let existingUrls = [];
              const existingPics = picturePreview.filter(pic => typeof pic === 'string' && pic.startsWith('http'));
              existingUrls = existingPics;
              const newPics = formData.pictures.filter(pic => pic instanceof File);
              if (newPics.length > 0) {
                  const newUrls = await uploadPictures(newPics, contentId);
                  pictureURLs = [...existingUrls, ...newUrls];
              } else {
                  pictureURLs = existingUrls;
              }

              contentData.pictureURLs = pictureURLs;
              await updateDoc(doc(firestore, 'educational', contentId), contentData);
              setEducationalContent(educationalContent.map(item =>
                  item.id === contentId ? { ...item, ...contentData } : item
              ));
              showToast("Educational content saved successfully!", "success");
          }
          resetForm();
      } catch (error) {
          console.error("Error saving educational content:", error);
          showToast("Failed to save educational content. Please try again.", "error");
      } finally {
          setLoading(false);
          setUploadProgress(0);
      }
  };

  const resetForm = () => {
      setFormData({
          title: '',
          category: '',
          content: '',
          publishDate: '',
          author: '',
          pictures: []
      });
      setPicturePreview([]);
      setShowForm(false);
      setIsEditing(false);
      setCurrentContentId(null);
      setUploadProgress(0);
  };

  const handleEditContent = (item) => {
      setCurrentContentId(item.id);
      setFormData({
          title: item.title,
          category: item.category,
          content: item.content,
          publishDate: item.publishDate,
          author: item.author,
          pictures: []
      });

      if (item.pictureURLs && item.pictureURLs.length > 0) {
          setPicturePreview(item.pictureURLs);
      } else {
          setPicturePreview([]);
      }

      setIsEditing(true);
      setShowForm(true);
  };

const handleDeleteContent = async (contentId, pictureURLs) => {
    showConfirmModal(
        "Delete Educational Content",
        "Are you sure you want to delete this educational content?",
        async () => {
            closeConfirmModal();
            setLoading(true);
            try {
                await deleteDoc(doc(firestore, 'educational', contentId));

                if (pictureURLs && pictureURLs.length > 0) {
                    for (const url of pictureURLs) {
                        try {
                            const picPath = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
                            const fileRef = storageRef(storage, picPath);
                            await deleteObject(fileRef);
                        } catch (imageError) {
                            console.warn("Error deleting image:", imageError);
                        }
                    }
                }
                setEducationalContent(prevContent => 
                    prevContent.filter(item => item.id !== contentId)
                );
                
                showToast("Educational content deleted successfully!", "success");
                
            } catch (error) {
                console.error("Error deleting educational content:", error);
                showToast("Failed to delete educational content. Please try again.", "error");
            } finally {
                setLoading(false);
            }
        },
        "danger"
    );
};

const handleViewContentDetails = async (contentId) => {
  try {
      const contentDoc = doc(firestore, 'educational', contentId);
      const contentSnapshot = await getDoc(contentDoc);

      if (contentSnapshot.exists()) {
          const contentData = contentSnapshot.data();
          setDetailContent({
              ...contentData,
              id: contentId
          });
          setShowDetailModal(true);
      } else {
          showToast("Educational content not found!", "warning");
      }
  } catch (error) {
      console.error("Error fetching educational content details:", error);
      showToast("Failed to fetch educational content details.", "error");
  }
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const DetailModal = ({ content, onClose }) => {
  if (!content) return null;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-navy-900">{content.title}</h2>
              <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
              </button>
          </div>

          <div className="p-6">
              <div className="mb-6">
                  <div className="flex flex-wrap items-center text-sm text-gray-600 mb-4">
                      <div className="mr-6 mb-2">
                          <span className="font-semibold">Category:</span> {content.category}
                      </div>
                      <div className="mr-6 mb-2">
                          <span className="font-semibold">Author:</span> {content.author}
                      </div>
                      <div className="mb-2">
                          <span className="font-semibold">Published:</span> {formatDate(content.publishDate)}
                      </div>
                  </div>
                  <div className="prose max-w-none mb-8">
                      {content.content.split('\n').map((paragraph, idx) => (
                          paragraph ? <p key={idx} className="mb-4">{paragraph}</p> : <br key={idx} />
                      ))}
                  </div>
              </div>
              {content.pictureURLs && content.pictureURLs.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {content.pictureURLs.map((url, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={url}
                            alt={`${content.title} ${idx + 1}`}
                            className="w-full h-64 object-cover rounded-lg shadow-md"/>
                            <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-2 right-2 bg-white bg-opacity-75 p-2 rounded-full shadow-md hover:bg-opacity-100"
                            title="View full size image"
                            >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            </a>
                          </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                  onClick={onClose}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                  Close
              </button>
          </div>
          </div>
      </div>
  );
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
              <h1 className="text-2xl font-bold text-navy-900">Educational Content Management</h1>
              <p className="text-gray-600">Create and manage educational content about the 5th CRG</p>
          </div>
          <button
              onClick={() => {
                  if (showForm) {
                      resetForm();
                  } else {
                      setShowForm(true);
                  }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center"
              disabled={loading}
          >
              <span className="mr-2">{showForm ? '✕' : '+'}</span>
              {showForm ? 'Cancel' : 'Add Educational Content'}
          </button>
      </div>

      {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-navy-900 mb-4">
                  {isEditing ? 'Edit Educational Content' : 'Create Educational Content'}
              </h2>
              <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                          <label className="block text-gray-700 mb-2">Content Title *</label>
                          <input
                              type="text"
                              name="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                              disabled={loading}
                          />
                      </div>
                      <div>
                          <label className="block text-gray-700 mb-2">Category *</label>
                          <input
                              type="text"
                              name="category"
                              value={formData.category}
                              onChange={handleInputChange}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                              disabled={loading}
                          />
                      </div>
                      <div>
                          <label className="block text-gray-700 mb-2">Publish Date *</label>
                          <input
                              type="date"
                              name="publishDate"
                              value={formData.publishDate}
                              onChange={handleInputChange}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                              disabled={loading}
                          />
                      </div>
                      <div className="md:col-span-2">
                          <label className="block text-gray-700 mb-2">Author *</label>
                          <input
                              type="text"
                              name="author"
                              value={formData.author}
                              onChange={handleInputChange}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                              disabled={loading}
                          />
                      </div>
                      <div className="md:col-span-2">
                          <label className="block text-gray-700 mb-2">Content *</label>
                          <textarea
                              name="content"
                              value={formData.content}
                              onChange={handleInputChange}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                              required
                              disabled={loading}
                          ></textarea>
                      </div>
                      <div className="md:col-span-2">
                          <label className="block text-gray-700 mb-2">Images</label>
                          <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handlePicturesChange}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={loading}
                          />

                          {uploadProgress > 0 && uploadProgress < 100 && (
                              <div className="mt-2">
                                  <div className="bg-gray-200 rounded-full h-2.5">
                                      <div
                                          className="bg-green-600 h-2.5 rounded-full"
                                          style={{ width: `${uploadProgress}%` }}
                                      ></div>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Uploading: {Math.round(uploadProgress)}%</p>
                              </div>
                          )}

                          {picturePreview.length > 0 && (
                              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {picturePreview.map((src, index) => (
                                      <div key={index} className="relative">
                                          <img src={src} alt={`Preview ${index}`} className="h-24 w-full object-cover rounded" />
                                          <button
                                              type="button"
                                              onClick={() => removePicture(index)}
                                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                              disabled={loading}
                                          >
                                              ✕
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                      <button
                          type="button"
                          onClick={resetForm}
                          className="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                          disabled={loading}
                      >
                          Cancel
                      </button>
                      <button
                          type="submit"
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                          disabled={loading}
                      >
                          {loading ? 'Saving...' : isEditing ? 'Update Content' : 'Publish Content'}
                      </button>
                  </div>
              </form>
          </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-navy-900 mb-4">Educational Content</h2>
          {loading && !showForm ? (
              <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2">Loading educational content...</p>
              </div>
          ) : educationalContent.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                  No educational content found. Create your first educational content!
              </p>
          ) : (
              <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                      <thead>
                          <tr className="bg-gray-100 text-gray-600 text-left">
                              <th className="py-3 px-4 font-semibold">Title</th>
                              <th className="py-3 px-4 font-semibold">Category</th>
                              <th className="py-3 px-4 font-semibold">Author</th>
                              <th className="py-3 px-4 font-semibold">Publish Date</th>
                              <th className="py-3 px-4 font-semibold">Images</th>
                              <th className="py-3 px-4 font-semibold">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="text-gray-600">
                          {educationalContent.map((item) => (
                              <tr key={item.id} className="border-b border-gray-200">
                                  <td className="py-3 px-4">{item.title}</td>
                                  <td className="py-3 px-4">{item.category}</td>
                                  <td className="py-3 px-4">{item.author}</td>
                                  <td className="py-3 px-4">{formatDate(item.publishDate)}</td>
                                  <td className="py-3 px-4">
                                      {item.pictureURLs && item.pictureURLs.length > 0 ? (
                                          <div className="flex space-x-1">
                                              {item.pictureURLs.slice(0, 2).map((url, idx) => (
                                                  <img
                                                      key={idx}
                                                      src={url}
                                                      alt={`${item.title} ${idx + 1}`}
                                                      className="w-8 h-8 object-cover rounded"
                                                  />
                                              ))}
                                              {item.pictureURLs.length > 2 && (
                                                  <span className="bg-gray-200 w-8 h-8 rounded flex items-center justify-center text-xs">
                                                      +{item.pictureURLs.length - 2}
                                                  </span>
                                              )}
                                          </div>
                                      ) : (
                                          <span className="text-gray-400">No images</span>
                                      )}
                                  </td>
                                  <td className="py-3 px-4">
                                      <button
                                          className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-blue-200"
                                          onClick={() => handleViewContentDetails(item.id)}
                                          disabled={loading}
                                      >
                                          👁️
                                      </button>
                                      <button
                                          className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-yellow-200"
                                          onClick={() => handleEditContent(item)}
                                          disabled={loading}
                                      >
                                          📝
                                      </button>
                                      <button
                                          className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-red-200"
                                          onClick={() => handleDeleteContent(item.id, item.pictureURLs)}
                                          disabled={loading}
                                      >
                                          🗑️
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
      </div>
      {showDetailModal && detailContent && (
          <DetailModal
              content={detailContent}
              onClose={() => {
                  setShowDetailModal(false);
                  setDetailContent(null);
              }}
          />
      )}
  </Layout>
  );
};

export default EducationalPage;