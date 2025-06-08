import React, { useState, useEffect } from 'react';
import { firestore, storage, auth } from '../Firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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

const PartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyDescription: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    logo: null
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPartnerId, setCurrentPartnerId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPartner, setDetailPartner] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const partnersCollection = collection(firestore, 'partners');
        const partnersQuery = query(partnersCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(partnersQuery);

        const partnersArray = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPartners(partnersArray);
      } catch (error) {
        console.error("Error fetching partners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file.', 'warning');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB.', 'warning');
        return;
      }

      setFormData({
        ...formData,
        logo: file
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (file, partnerId) => {
    if (!file) return null;

    try {
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name}`;
      const fileRef = storageRef(storage, `partner-logos/${partnerId}/${fileName}`);

      await uploadBytes(fileRef, file);

      const downloadURL = await getDownloadURL(fileRef);

      setUploadProgress(100);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading logo:", error);
      throw error;
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setUploadProgress(0);

    try {
      let partnerId = currentPartnerId;
      let logoURL = null;

      const partnerData = {
        name: formData.companyName,
        description: formData.companyDescription,
        website: formData.website,
        socialMedia: {
          facebook: formData.facebook,
          instagram: formData.instagram,
          twitter: formData.twitter,
          youtube: formData.youtube
        },
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid // Add user tracking
      };

      if (!isEditing) {
        partnerData.createdAt = new Date().toISOString();
        partnerData.createdBy = auth.currentUser.uid; // Add user tracking

        const docRef = await addDoc(collection(firestore, 'partners'), partnerData);
        partnerId = docRef.id;

        if (formData.logo && formData.logo instanceof File) {
          logoURL = await uploadLogo(formData.logo, partnerId);
          if (logoURL) {
            await updateDoc(doc(firestore, 'partners', partnerId), {
              logoURL: logoURL
            });
          }
        }
        const updatedPartner = {
          id: partnerId,
          ...partnerData,
          logoURL: logoURL
        };

        setPartners([updatedPartner, ...partners]);
        showToast("Partner saved successfully!", "success");
      }
      else {
        if (formData.logo && formData.logo instanceof File) {
          logoURL = await uploadLogo(formData.logo, partnerId);
          partnerData.logoURL = logoURL;
        } else if (logoPreview && typeof logoPreview === 'string' && logoPreview.startsWith('http')) {
          partnerData.logoURL = logoPreview;
        }

        await updateDoc(doc(firestore, 'partners', partnerId), partnerData);

        setPartners(partners.map(partner =>
          partner.id === partnerId ? { ...partner, ...partnerData } : partner
        ));
        showToast("Partner updated successfully!", "success");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving partner:", error);
      showToast("Failed to save partner. Please try again.", "error");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      companyDescription: '',
      website: '',
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      logo: null
    });
    setLogoPreview(null);
    setShowForm(false);
    setIsEditing(false);
    setCurrentPartnerId(null);
    setUploadProgress(0);
  };

  const handleEditPartner = (partner) => {
    setCurrentPartnerId(partner.id);
    setFormData({
      companyName: partner.name,
      companyDescription: partner.description,
      website: partner.website || '',
      facebook: partner.socialMedia?.facebook || '',
      instagram: partner.socialMedia?.instagram || '',
      twitter: partner.socialMedia?.twitter || '',
      youtube: partner.socialMedia?.youtube || '',
      logo: null
    });

    if (partner.logoURL) {
      setLogoPreview(partner.logoURL);
    }

    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeletePartner = async (partnerId, logoURL) => {
    showConfirmModal(
      "Delete Partner",
      "Are you sure you want to delete this partner?",
      async () => {
        closeConfirmModal();
        setLoading(true);

        try {
          await deleteDoc(doc(firestore, 'partners', partnerId));

          if (logoURL) {
            try {
              const logoPath = decodeURIComponent(logoURL.split('/o/')[1].split('?')[0]);
              const fileRef = storageRef(storage, logoPath);
              await deleteObject(fileRef);
            } catch (error) {
              console.error("Error deleting logo:", error);
            }
          }

          setPartners(partners.filter(partner => partner.id !== partnerId));
          showToast("Partner deleted successfully!", "success");
        } catch (error) {
          console.error("Error deleting partner:", error);
          showToast("Failed to delete partner. Please try again.", "error");
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  const handleViewPartnerDetails = async (partnerId) => {
    try {
      const partnerDoc = doc(firestore, 'partners', partnerId);
      const partnerSnapshot = await getDoc(partnerDoc);

      if (partnerSnapshot.exists()) {
        const partnerData = partnerSnapshot.data();
        setDetailPartner({
          ...partnerData,
          id: partnerId
        });
        setShowDetailModal(true);
      } else {
        showToast("Partner not found!", "warning");
      }
    } catch (error) {
      console.error("Error fetching partner details:", error);
      showToast("Failed to fetch partner details.", "error");
    }
  };

  const DetailModal = ({ partner, onClose }) => {
    if (!partner) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-navy-900">{partner.name}</h2>
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
            <div className="flex items-center mb-6">
              {partner.logoURL ? (
                <img
                  src={partner.logoURL}
                  alt={`${partner.name} logo`}
                  className="w-24 h-24 object-contain rounded-lg mr-4"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">🏢</span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold">{partner.name}</h3>
                {partner.website && (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline mt-1 inline-block"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">About {partner.name}</h3>
              <p className="text-gray-700">{partner.description}</p>
            </div>
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
          <h1 className="text-2xl font-bold text-navy-900">Partners Management</h1>
          <p className="text-gray-600">Manage your partners</p>
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
          {showForm ? 'Cancel' : 'Add New Partner'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-navy-900 mb-4">
            {isEditing ? 'Edit Partner' : 'Add New Partner'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Company Description *</label>
                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  required
                  disabled={loading}
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-navy-900 mb-2">Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <span className="mr-2">Facebook</span>
                    </label>
                    <input
                      type="text"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleInputChange}
                      placeholder="https://facebook.com/companyname"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <span className="mr-2">Instagram</span>
                    </label>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      placeholder="https://instagram.com/companyname"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <span className="mr-2">Twitter</span>
                    </label>
                    <input
                      type="text"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      placeholder="https://twitter.com/companyname"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <span className="mr-2">YouTube</span>
                    </label>
                    <input
                      type="text"
                      name="youtube"
                      value={formData.youtube}
                      onChange={handleInputChange}
                      placeholder="https://youtube.com/channel/channelid"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Company Logo</label>
                <div className="flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                  {logoPreview && (
                    <div className="ml-4">
                      <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-contain" />
                    </div>
                  )}
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Uploading: {Math.round(uploadProgress)}%</p>
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
                {loading ? 'Saving...' : isEditing ? 'Update Partner' : 'Save Partner'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-navy-900 mb-4">Partners List</h2>
        {loading && !showForm ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p>Loading partners...</p>
          </div>
        ) : partners.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No partners found. Add your first partner!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-left">
                  <th className="py-3 px-4 font-semibold">Company</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Website</th>
                  <th className="py-3 px-4 font-semibold">Social Media</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {partners.map((partner) => (
                  <tr key={partner.id} className="border-b border-gray-200">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {partner.logoURL ? (
                          <img src={partner.logoURL} alt={partner.name} className="w-8 h-8 mr-2 object-contain" />
                        ) : (
                          <div className="w-8 h-8 mr-2 bg-gray-200 rounded-full flex items-center justify-center">
                            <span>🏢</span>
                          </div>
                        )}
                        {partner.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {partner.description && partner.description.length > 50
                        ? `${partner.description.substring(0, 50)}...`
                        : partner.description}
                    </td>
                    <td className="py-3 px-4">
                      {partner.website ? (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Visit
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {partner.socialMedia?.facebook && (
                          <a
                            href={partner.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            FB
                          </a>
                        )}
                        {partner.socialMedia?.instagram && (
                          <a
                            href={partner.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-pink-800"
                          >
                            IG
                          </a>
                        )}
                        {partner.socialMedia?.twitter && (
                          <a
                            href={partner.socialMedia.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-600"
                          >
                            TW
                          </a>
                        )}
                        {partner.socialMedia?.youtube && (
                          <a
                            href={partner.socialMedia.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-800"
                          >
                            YT
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        className="text-yellow-500 hover:text-yellow-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-yellow-200"
                        onClick={() => handleEditPartner(partner)}
                        disabled={loading}
                        title="Edit Partner"
                      >
                        📝
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-red-200"
                        onClick={() => handleDeletePartner(partner.id, partner.logoURL)}
                        disabled={loading}
                        title="Delete Partner"
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
      {showDetailModal && detailPartner && (
        <DetailModal
          partner={detailPartner}
          onClose={() => {
            setShowDetailModal(false);
            setDetailPartner(null);
          }}
        />
      )}
    </Layout>
  );
};

export default PartnersPage;