import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { firestore } from '../Firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

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

const InquiriesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState(null); // Toast state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        console.log('Fetching inquiries...');
        const inquiriesCollection = collection(firestore, 'inquiries');
        
        // Use submittedAt instead of createdAt for ordering
        const inquiriesQuery = query(inquiriesCollection, orderBy('submittedAt', 'desc'));
        const snapshot = await getDocs(inquiriesQuery);
        
        console.log('Documents found:', snapshot.size);
        
        const inquiriesArray = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Document data:', data);
          
          return {
            id: doc.id,
            // Map Firebase fields to expected fields
            fullName: data.name || '', // name -> fullName
            organization: data.organization || '',
            email: data.email || '',
            contactNumber: data.phone || '', // phone -> contactNumber
            message: data.message || '',
            status: data.status || 'new',
            createdAt: data.submittedAt || data.submittedAt, // submittedAt -> createdAt
            updatedAt: data.updatedAt || data.submittedAt,
            source: data.source || '',
            // Keep original fields as backup
            ...data
          };
        });
        
        console.log('Processed inquiries:', inquiriesArray);
        setInquiries(inquiriesArray);
      } catch (error) {
        console.error("Error fetching inquiries:", error);
        showToast(`Error loading inquiries: ${error.message}`, "error");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInquiries();
  }, []);

  const handleStatusUpdate = async (inquiryId, newStatus) => {
    setLoading(true);
    
    try {
      await updateDoc(doc(firestore, 'inquiries', inquiryId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      setInquiries(inquiries.map(inquiry => 
        inquiry.id === inquiryId 
          ? { ...inquiry, status: newStatus, updatedAt: new Date().toISOString() }
          : inquiry
      ));
      
      showToast("Status updated successfully!", "success");
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update status. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    showConfirmModal(
      "Delete Inquiry",
      "Are you sure you want to delete this inquiry? This action cannot be undone.",
      async () => {
        setLoading(true);
        
        try {
          await deleteDoc(doc(firestore, 'inquiries', inquiryId));
          setInquiries(inquiries.filter(inquiry => inquiry.id !== inquiryId));
          
          if (selectedInquiry && selectedInquiry.id === inquiryId) {
            setSelectedInquiry(null);
            setShowDetails(false);
          }
          
          showToast("Inquiry deleted successfully!", "success");
        } catch (error) {
          console.error("Error deleting inquiry:", error);
          showToast("Failed to delete inquiry. Please try again.", "error");
        } finally {
          setLoading(false);
          closeConfirmModal();
        }
      },
      "danger"
    );
  };

  const handleViewDetails = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowDetails(true);
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
    if (!dateString) return 'N/A';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    // Handle both timestamp and ISO string formats
    let date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString.toDate) {
      // Firestore timestamp
      date = dateString.toDate();
    } else {
      date = new Date(dateString);
    }
    
    return date.toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => 
    filterStatus === 'all' || inquiry.status === filterStatus
  );

  const getInquiryStats = () => {
    const stats = {
      total: inquiries.length,
      new: inquiries.filter(i => i.status === 'new').length,
      contacted: inquiries.filter(i => i.status === 'contacted').length,
      inProgress: inquiries.filter(i => i.status === 'in-progress').length,
      completed: inquiries.filter(i => i.status === 'completed').length,
      rejected: inquiries.filter(i => i.status === 'rejected').length
    };
    return stats;
  };

  const stats = getInquiryStats();

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
          <h1 className="text-2xl font-bold text-navy-900">Partnership Inquiries</h1>
          <p className="text-gray-600">Manage partnership requests from your website</p>
        </div>
        {showDetails && (
          <button 
            onClick={() => {
              setShowDetails(false);
              setSelectedInquiry(null);
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded flex items-center"
          >
            <span className="mr-2">←</span>
            Back to List
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          <div className="text-sm text-gray-600">New</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
          <div className="text-sm text-gray-600">Contacted</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {showDetails && selectedInquiry ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-navy-900 mb-2">Inquiry Details</h2>
              <p className="text-gray-600">Submitted on {formatDate(selectedInquiry.createdAt || selectedInquiry.submittedAt)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedInquiry.status}
                onChange={(e) => handleStatusUpdate(selectedInquiry.id, e.target.value)}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-800">{selectedInquiry.fullName || selectedInquiry.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Organization</label>
                  <p className="text-gray-800">{selectedInquiry.organization}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email Address</label>
                  <p className="text-gray-800">
                    <a href={`mailto:${selectedInquiry.email}`} className="text-blue-600 hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Contact Number</label>
                  <p className="text-gray-800">
                    <a href={`tel:${selectedInquiry.contactNumber || selectedInquiry.phone}`} className="text-blue-600 hover:underline">
                      {selectedInquiry.contactNumber || selectedInquiry.phone}
                    </a>
                  </p>
                </div>
                {selectedInquiry.source && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Source</label>
                    <p className="text-gray-800">{selectedInquiry.source}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Status & Timeline</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Current Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(selectedInquiry.status)}`}>
                    {selectedInquiry.status.charAt(0).toUpperCase() + selectedInquiry.status.slice(1).replace('-', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Submitted</label>
                  <p className="text-gray-800">{formatDate(selectedInquiry.createdAt || selectedInquiry.submittedAt)}</p>
                </div>
                {selectedInquiry.updatedAt && selectedInquiry.updatedAt !== (selectedInquiry.createdAt || selectedInquiry.submittedAt) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-gray-800">{formatDate(selectedInquiry.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-2">Message</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">{selectedInquiry.message}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-navy-900">Inquiries List</h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-600">Filter by status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p>Loading inquiries...</p>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {filterStatus === 'all' ? 'No inquiries found.' : `No ${filterStatus.replace('-', ' ')} inquiries found.`}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-left">
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">Organization</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Contact</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {filteredInquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{inquiry.fullName || inquiry.name}</div>
                      </td>
                      <td className="py-3 px-4">{inquiry.organization}</td>
                      <td className="py-3 px-4">
                        <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">
                          {inquiry.email}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <a href={`tel:${inquiry.contactNumber || inquiry.phone}`} className="text-blue-600 hover:underline">
                          {inquiry.contactNumber || inquiry.phone}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(inquiry.status)}`}>
                          {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatDate(inquiry.createdAt || inquiry.submittedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <button 
                          className="text-blue-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-blue-200"
                          onClick={() => handleViewDetails(inquiry)}
                          disabled={loading}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <select
                          value={inquiry.status}
                          onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value)}
                          className="text-xs p-1 border border-gray-300 rounded mr-2"
                          disabled={loading}
                          title="Update Status"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button 
                          className="text-red-500 hover:text-red-700 hover:scale-110 rounded-full p-1 hover:bg-red-200"
                          onClick={() => handleDeleteInquiry(inquiry.id)}
                          disabled={loading}
                          title="Delete"
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
      )}
    </Layout>
  );
};

export default InquiriesPage;