import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import jsPDF from 'jspdf';
import { useAuth } from '../contexts/AuthContext';
import AOS from 'aos';

// Custom marker icon
const reportIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiNFRjQ0NDQiLz4KPHBhdGggZD0iTTEyLjUgMzVMMTggMjVIN0wxMi41IDM1WiIgZmlsbD0iI0VGNDQ0NCIvPgo8Y2lyY2xlIGN4PSIxMi41IiBjeT0iMTIuNSIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: null,
  shadowSize: [41, 41],
});

// Icons and utilities
const Icons = {
  Garbage: '🗑️',
  Pothole: '🛣️',
  'Water Leakage': '💧',
  'Street Light': '💡',
  'Road Damage': '🚧',
  'Drainage Problem': '🌊',
  'Park Maintenance': '🌳',
  'Traffic Signal': '🚦',
  'Noise Complaint': '🔊',
  Other: '📋',
  Search: '🔍',
  Filter: '🎛️',
  Map: '🗺️',
  Calendar: '📅',
  Edit: '✏️',
  Delete: '🗑️',
  Eye: '👁️',
  Download: '📥',
  Timeline: '📈',
  Close: '✖️',
  ChevronDown: '▼',
  ChevronUp: '▲',
  DownloadPDF: '📄'
};

const getCategoryIcon = (category) => Icons[category] || Icons.Other;

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'Resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'Rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Map Modal Component
const MapModal = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {getCategoryIcon(report.category)} {report.category}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              {Icons.Close}
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300 mb-2">{report.description}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {Icons.Calendar} {formatDate(report.createdAt)}
            </p>
          </div>

          <div className="h-96 w-full rounded-xl overflow-hidden">
            <MapContainer
              center={[report.latitude, report.longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              className="rounded-xl"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[report.latitude, report.longitude]} icon={reportIcon}>
                <Popup>
                  <div className="text-center">
                    <strong>{report.category}</strong>
                    <br />
                    <span className="text-sm">{report.description}</span>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Browse Issue Map Modal Component
const BrowseIssueMapModal = ({ isOpen, onClose, isDarkMode }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [allIssues, setAllIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const categories = ['Garbage Collection', 'Pothole', 'Water Leakage', 'Street Light', 'Road Damage', 'Drainage Problem', 'Park Maintenance', 'Traffic Signal', 'Noise Complaint', 'Other'];

  // Fetch all issues from API
  const fetchAllIssues = async () => {
    try {
      const response = await fetch('/api/issues');
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error('Failed to fetch issues');
        return [];
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      return [];
    }
  };

  // Create different colored markers for different statuses
  const createStatusIcon = (status) => {
    let color;
    switch (status) {
      case 'Pending':
        color = '#EAB308'; // yellow
        break;
      case 'In Progress':
        color = '#3B82F6'; // blue
        break;
      case 'Resolved':
        color = '#10B981'; // green
        break;
      default:
        color = '#6B7280'; // gray
    }

    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="25" height="41" viewBox="0 0 25 41" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 0C19.4036 0 25 5.59644 25 12.5C25 19.4036 19.4036 25 12.5 25C5.59644 25 0 19.4036 0 12.5C0 5.59644 5.59644 0 12.5 0Z" fill="${color}"/>
          <path d="M12.5 35L18 25H7L12.5 35Z" fill="${color}"/>
          <circle cx="12.5" cy="12.5" r="4" fill="white"/>
        </svg>
      `)}`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: null,
      shadowSize: [41, 41],
    });
  };

  // User location icon
  const userIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiMzQjgyRjYiLz4KPHBhdGggZD0iTTEyLjUgMzVMMTggMjVIN0wxMi41IDM1WiIgZmlsbD0iIzNCODJGNiIvPgo8Y2lyY2xlIGN4PSIxMi41IiBjeT0iMTIuNSIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: null,
    shadowSize: [41, 41],
  });

  // Get user location and load issues
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError('Location access denied. Showing default view.');
          setUserLocation([40.7128, -74.0060]); // Default to NYC
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setLocationError('Geolocation not supported. Showing default view.');
      setUserLocation([40.7128, -74.0060]);
    }

    // Fetch all issues from API
    fetchAllIssues().then(issues => {
      setAllIssues(issues);
      setFilteredIssues(issues);
      setLoading(false);
    });
  }, [isOpen]);

  // Filter issues based on search and filters
  useEffect(() => {
    let filtered = [...allIssues];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(issue => 
        issue.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (issue.address && issue.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(issue => issue.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    setFilteredIssues(filtered);
  }, [allIssues, searchTerm, categoryFilter, statusFilter]);

  const handleViewDetails = (issue) => {
    onClose();
    // Here you could navigate to a detailed issue page
    console.log('View details for issue:', issue._id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 border-b ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                🗺️ Browse All Issues
              </h3>
              <button
                onClick={onClose}
                className={`text-3xl transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {Icons.Close}
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <span className="absolute left-3 top-3.5 text-gray-400">{Icons.Search}</span>
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mt-4">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {filteredIssues.length} of {allIssues.length} issues
              </p>
              <div className="flex space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Pending</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>In Progress</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Resolved</span>
                </span>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="h-full p-6">
            {loading ? (
              <div className={`h-[calc(100%-2rem)] rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Loading issues map...
                  </p>
                </div>
              </div>
            ) : locationError && !userLocation ? (
              <div className={`h-[calc(100%-2rem)] rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="text-center">
                  <div className="text-6xl mb-4">🗺️</div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Unable to load issue map
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Please check your location permissions and try again.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[calc(100%-2rem)] w-full rounded-xl overflow-hidden shadow-lg">
                <MapContainer
                  center={userLocation || [40.7128, -74.0060]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  className="rounded-xl"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  <MarkerClusterGroup>
                    {/* User location marker */}
                    {userLocation && (
                      <Marker position={userLocation} icon={userIcon}>
                        <Popup>
                          <div className="text-center">
                            <strong>Your Location</strong>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Issue markers */}
                    {filteredIssues.map(issue => (
                                             <Marker
                         key={issue._id}
                         position={[issue.location.coordinates[1], issue.location.coordinates[0]]}
                         icon={createStatusIcon(issue.status)}
                       >
                         <Popup className="custom-popup">
                           <div className="max-w-xs p-2">
                             <div className="flex items-center space-x-2 mb-2">
                               <span className="text-lg">{getCategoryIcon(issue.category)}</span>
                               <h4 className="font-semibold text-gray-900">{issue.category}</h4>
                             </div>
                             
                             <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                               {issue.description}
                             </p>
                             
                             <div className="flex items-center justify-between mb-3">
                               <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                                 {issue.status}
                               </span>
                               <span className="text-xs text-gray-500">
                                 🔼 {issue.upvotes || 0} upvotes
                               </span>
                             </div>

                             <button
                               onClick={() => handleViewDetails(issue)}
                               className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md"
                             >
                               View Details
                             </button>
                           </div>
                         </Popup>
                       </Marker>
                    ))}
                  </MarkerClusterGroup>
                </MapContainer>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Toast Component
const Toast = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl ${
            type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// PDF Generation Function
const generateReportPDF = (report, showToast) => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Set font
    pdf.setFont('helvetica', 'normal');

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('📝 Civic Issue Report', margin, yPosition);
    
    yPosition += 20;
    
    // Separator line
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Report details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    // Category
    pdf.setFont('helvetica', 'bold');
    pdf.text('Category:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(report.category, margin + 25, yPosition);
    yPosition += 15;

    // Description
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description:', margin, yPosition);
    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    
    // Handle long descriptions
    const descriptionLines = pdf.splitTextToSize(report.description, pageWidth - 2 * margin);
    pdf.text(descriptionLines, margin, yPosition);
    yPosition += descriptionLines.length * 6 + 10;

    // Status
    pdf.setFont('helvetica', 'bold');
    pdf.text('Status:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(report.status, margin + 25, yPosition);
    yPosition += 15;

    // Submitted Date
    pdf.setFont('helvetica', 'bold');
    pdf.text('Submitted:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatDate(report.createdAt), margin + 30, yPosition);
    yPosition += 15;

    // Location
    pdf.setFont('helvetica', 'bold');
    pdf.text('Location:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    if (report.address) {
      const addressLines = pdf.splitTextToSize(report.address, pageWidth - 2 * margin - 30);
      pdf.text(addressLines, margin + 28, yPosition);
      yPosition += addressLines.length * 6 + 5;
    }
    
    // Coordinates
    pdf.text(`Coordinates: ${report.latitude.toFixed(6)}° N, ${report.longitude.toFixed(6)}° E`, margin, yPosition);
    yPosition += 15;

    // Upvotes
    pdf.setFont('helvetica', 'bold');
    pdf.text('Upvotes:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text((report.upvotes || 0).toString(), margin + 25, yPosition);
    yPosition += 20;

    // Images section
    if (report.images && report.images.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Attached Images:', margin, yPosition);
      yPosition += 10;
      pdf.setFont('helvetica', 'normal');
      report.images.forEach((image, index) => {
        pdf.text(`${index + 1}. ${image.originalName || image.filename}`, margin + 5, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Footer
    yPosition += 20;
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Report ID: ${report.id}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Generated on: ${formatDate(new Date().toISOString())}`, margin, yPosition);

    // Footer text
    yPosition += 15;
    pdf.setFont('helvetica', 'italic');
    pdf.text('Generated by Civic Connect - Building Better Communities Together', margin, yPosition);

    // Save the PDF
    pdf.save(`report_${report.id}.pdf`);
    
    if (showToast) {
      showToast('Report downloaded successfully!', 'success');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (showToast) {
      showToast('Error generating PDF. Please try again.', 'error');
    }
  }
};

// Report Card Component
const ReportCard = ({ report, onViewMap, onEdit, onDelete, onDownloadPDF, isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const truncateDescription = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const canEdit = report.status !== 'Resolved';

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    // Small delay to show loading state
    setTimeout(() => {
      onDownloadPDF(report);
      setIsDownloading(false);
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getCategoryIcon(report.category)}</span>
          <div>
            <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {report.category}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {Icons.Calendar} {formatDate(report.createdAt)}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
          {report.status}
        </span>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
          {isExpanded ? report.description : truncateDescription(report.description)}
        </p>
        {report.description.length > 100 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-500 hover:text-blue-600 text-sm mt-2 font-medium"
          >
            {isExpanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Image Preview */}
      {report.images && report.images.length > 0 && (
        <div className="mb-4">
          <div className="flex space-x-2">
            {report.images.slice(0, isImageExpanded ? report.images.length : 3).map((image, index) => (
              <img
                key={index}
                src={`/uploads/${image.filename}`}
                alt={`Report ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setIsImageExpanded(!isImageExpanded)}
              />
            ))}
            {report.images.length > 3 && !isImageExpanded && (
              <button
                onClick={() => setIsImageExpanded(true)}
                className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                +{report.images.length - 3}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center space-x-4 mb-4">
        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          🔼 {report.upvotes || 0} upvotes
        </span>
        {report.address && (
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            📍 {report.address.split(',')[0]}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewMap(report)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 text-sm font-medium"
        >
          <span>{Icons.Map}</span>
          <span>View on Map</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium shadow-md ${
            isDownloading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <span>{Icons.DownloadPDF}</span>
              <span>Download PDF</span>
            </>
          )}
        </motion.button>
        
        {canEdit && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(report)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-300 text-sm font-medium"
            >
              <span>{Icons.Edit}</span>
              <span>Edit</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(report)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 text-sm font-medium"
            >
              <span>{Icons.Delete}</span>
              <span>Delete</span>
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
};

// Timeline Component
const Timeline = ({ activities, isDarkMode }) => {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
      
      <div className="space-y-6">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-start space-x-4"
          >
            <div className="relative z-10 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {activity.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={`p-4 rounded-lg shadow-sm ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {activity.title}
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activity.description}
                </p>
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {formatDate(activity.date)}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = ({ isDarkMode }) => {
  const { user, logout } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showBrowseMapModal, setShowBrowseMapModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [timelineActivities, setTimelineActivities] = useState([]);

  // Mock data (replace with API calls)
  const mockReports = [
    {
      id: 1,
      category: 'Pothole',
      description: 'Large pothole on Main Street causing traffic issues. The hole is approximately 2 feet wide and 6 inches deep, making it dangerous for vehicles.',
      address: 'Main Street, Downtown, City',
      latitude: 40.7128,
      longitude: -74.0060,
      status: 'In Progress',
      upvotes: 12,
      createdAt: '2024-01-15T10:30:00Z',
      images: [
        { filename: 'pothole1.jpg', originalName: 'pothole1.jpg' },
        { filename: 'pothole2.jpg', originalName: 'pothole2.jpg' }
      ]
    },
    {
      id: 2,
      category: 'Garbage Collection',
      description: 'Overflowing garbage bins on Oak Avenue. Bins have not been emptied for over a week.',
      address: 'Oak Avenue, Residential Area, City',
      latitude: 40.7589,
      longitude: -73.9851,
      status: 'Resolved',
      upvotes: 8,
      createdAt: '2024-01-12T14:15:00Z',
      images: []
    },
    {
      id: 3,
      category: 'Street Light',
      description: 'Broken street light near the park entrance. Area is very dark at night.',
      address: 'Park Avenue, Near Central Park, City',
      latitude: 40.7831,
      longitude: -73.9712,
      status: 'Pending',
      upvotes: 5,
      createdAt: '2024-01-18T09:45:00Z',
      images: [{ filename: 'streetlight1.jpg', originalName: 'streetlight1.jpg' }]
    }
  ];

  const mockActivities = [
    {
      id: 1,
      type: 'report',
      title: 'Submitted Report',
      description: 'Reported broken streetlight on Park Avenue',
      date: '2024-01-18T09:45:00Z',
      icon: '📝'
    },
    {
      id: 2,
      type: 'status',
      title: 'Status Update',
      description: 'Pothole on Main Street marked as "In Progress"',
      date: '2024-01-16T11:20:00Z',
      icon: '🔄'
    },
    {
      id: 3,
      type: 'resolved',
      title: 'Issue Resolved',
      description: 'Garbage collection issue on Oak Avenue resolved',
      date: '2024-01-14T16:30:00Z',
      icon: '✅'
    }
  ];

  const stats = [
    { label: 'Total Reports', value: reports.length.toString(), icon: '📝' },
    { label: 'Resolved Issues', value: reports.filter(r => r.status === 'Resolved').length.toString(), icon: '✅' },
    { label: 'In Progress', value: reports.filter(r => r.status === 'In Progress').length.toString(), icon: '🔄' },
    { label: 'Total Upvotes', value: reports.reduce((sum, r) => sum + (r.upvotes || 0), 0).toString(), icon: '🔼' }
  ];

  // Initialize data
  useEffect(() => {
    AOS.refresh();
    
    // Simulate API call
    setTimeout(() => {
      setReports(mockReports);
      setFilteredReports(mockReports);
      setTimelineActivities(mockActivities);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...reports];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(report => report.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'upvotes':
        filtered.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        break;
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, categoryFilter, sortBy]);

  const handleLogout = async () => {
    await logout();
  };

  const handleViewMap = (report) => {
    setSelectedReport(report);
    setShowMapModal(true);
  };

  const handleEdit = (report) => {
    showToast('Edit functionality coming soon!', 'success');
  };

  const handleDelete = (report) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      setReports(reports.filter(r => r.id !== report.id));
      showToast('Report deleted successfully', 'success');
    }
  };

  const handleDownloadPDF = (report) => {
    generateReportPDF(report, showToast);
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const categories = ['Garbage Collection', 'Pothole', 'Water Leakage', 'Street Light', 'Road Damage', 'Drainage Problem', 'Park Maintenance', 'Traffic Signal', 'Noise Complaint', 'Other'];

  const TabButton = ({ id, label, icon, active, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(id)}
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
        active
          ? 'bg-blue-500 text-white shadow-lg transform translate-y-[-2px]'
          : isDarkMode
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </motion.button>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={`min-h-screen transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-blue-50 to-green-50'
      }`}
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`transition-all duration-500 shadow-xl ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-b`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className={`text-3xl font-bold transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Welcome back, {user?.email?.split('@')[0]}!
              </h1>
              <p className={`transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Here's your civic engagement dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  🏠 Home
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
            <TabButton 
              id="overview" 
              label="Overview" 
              icon="📊" 
              active={activeTab === 'overview'} 
              onClick={setActiveTab} 
            />
            <TabButton 
              id="reports" 
              label="My Reports" 
              icon="📝" 
              active={activeTab === 'reports'} 
              onClick={setActiveTab} 
            />
            <TabButton 
              id="timeline" 
              label="Timeline" 
              icon="📈" 
              active={activeTab === 'timeline'} 
              onClick={setActiveTab} 
            />
          </div>
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border cursor-pointer ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium transition-colors ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {stat.label}
                      </p>
                      <p className={`text-3xl font-bold transition-colors ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className="text-4xl">{stat.icon}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              <h3 className={`text-xl font-semibold mb-6 transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link 
                  to="/report-issue"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-center block"
                >
                  🚨 Report New Issue
                </Link>
                                 <motion.button
                   whileHover={{ scale: 1.05, y: -2 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setShowBrowseMapModal(true)}
                   className={`p-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                     isDarkMode 
                       ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                       : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                   }`}
                 >
                   🗺️ Browse Issue Map
                 </motion.button>
                                 <motion.button
                   whileHover={{ scale: 1.05, y: -2 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setActiveTab('reports')}
                   className={`p-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                     isDarkMode 
                       ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                       : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                   }`}
                 >
                   📥 Download Reports
                 </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Filters */}
            <div className={`sticky top-4 z-10 p-4 rounded-xl shadow-lg mb-6 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">{Icons.Search}</span>
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="recent">Most Recent</option>
                  <option value="upvotes">Most Upvoted</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Reports Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className={`p-6 rounded-xl shadow-lg animate-pulse ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div>
                        <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                        <div className="w-16 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="w-3/4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredReports.map(report => (
                   <ReportCard
                     key={report.id}
                     report={report}
                     onViewMap={handleViewMap}
                     onEdit={handleEdit}
                     onDelete={handleDelete}
                     onDownloadPDF={handleDownloadPDF}
                     isDarkMode={isDarkMode}
                   />
                 ))}
               </div>
            )}

            {filteredReports.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  No reports found
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`p-6 rounded-xl shadow-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-xl font-semibold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Activity Timeline
            </h3>
            <Timeline activities={timelineActivities} isDarkMode={isDarkMode} />
          </motion.div>
        )}
      </div>

             {/* Map Modal */}
       <MapModal
         isOpen={showMapModal}
         onClose={() => setShowMapModal(false)}
         report={selectedReport}
       />

       {/* Browse Issue Map Modal */}
       <BrowseIssueMapModal
         isOpen={showBrowseMapModal}
         onClose={() => setShowBrowseMapModal(false)}
         isDarkMode={isDarkMode}
       />

       {/* Toast */}
       <Toast
         message={toast.message}
         type={toast.type}
         isVisible={toast.show}
         onClose={() => setToast({ ...toast, show: false })}
       />
     </motion.div>
  );
};

export default Dashboard; 