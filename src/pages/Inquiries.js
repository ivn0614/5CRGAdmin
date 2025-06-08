import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { firestore } from '../Firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

const InquiriesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const inquiriesCollection = collection(firestore, 'inquiries');
        const inquiriesQuery = query(inquiriesCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(inquiriesQuery);
        
        const inquiriesArray = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setInquiries(inquiriesArray);
      } catch (error) {
        console.error("Error fetching inquiries:", error);
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
      
      alert("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    
    setLoading(true);
    
    try {
      await deleteDoc(doc(firestore, 'inquiries', inquiryId));
      setInquiries(inquiries.filter(inquiry => inquiry.id !== inquiryId));
      
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry(null);
        setShowDetails(false);
      }
      
      alert("Inquiry deleted successfully!");
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      alert("Failed to delete inquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowDetails(true);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
              <p className="text-gray-600">Submitted on {formatDate(selectedInquiry.createdAt)}</p>
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
                  <p className="text-gray-800">{selectedInquiry.fullName}</p>
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
                    <a href={`tel:${selectedInquiry.contactNumber}`} className="text-blue-600 hover:underline">
                      {selectedInquiry.contactNumber}
                    </a>
                  </p>
                </div>
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
                  <p className="text-gray-800">{formatDate(selectedInquiry.createdAt)}</p>
                </div>
                {selectedInquiry.updatedAt && selectedInquiry.updatedAt !== selectedInquiry.createdAt && (
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
                        <div className="font-medium text-gray-800">{inquiry.fullName}</div>
                      </td>
                      <td className="py-3 px-4">{inquiry.organization}</td>
                      <td className="py-3 px-4">
                        <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">
                          {inquiry.email}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <a href={`tel:${inquiry.contactNumber}`} className="text-blue-600 hover:underline">
                          {inquiry.contactNumber}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(inquiry.status)}`}>
                          {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatDate(inquiry.createdAt)}
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