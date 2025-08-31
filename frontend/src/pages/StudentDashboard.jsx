import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './StudentDashboard.css';

// Defines where the api is located
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.origin.includes('localhost')
    ? 'http://localhost:5006/api'
    : window.location.origin + '/api');

const api = {
  // Functions that call REST API endpoints for availability
  getAvailableHeadsets: () => fetchWithErrorHandling(`${API_BASE_URL}/headsets/available`),
  getTotalHeadsets: () => fetchWithErrorHandling(`${API_BASE_URL}/headsets/total`),
  getUnavailableHeadsets: () => fetchWithErrorHandling(`${API_BASE_URL}/headsets/unavailable`),
  getAllHeadsets: () => fetchWithErrorHandling(`${API_BASE_URL}/headsets/all`),

  // Sends a post request to book a headset for a given user
  bookHeadset: (userId, headsetId) => fetchWithErrorHandling(`${API_BASE_URL}/requests/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, headsetId })
  }),

  // Sends a post request to return a headset
  returnHeadset: (userId, headsetId) => fetchWithErrorHandling(`${API_BASE_URL}/requests/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, headsetId })
  }),

  // Get booking history (recent or all)
  getRecentRequests: (limit = 5) => fetchWithErrorHandling(`${API_BASE_URL}/requests/recent?limit=${limit}`),
  getAllRequests: () => fetchWithErrorHandling(`${API_BASE_URL}/requests/all`)
};

// Here we create a helper function
const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    throw new Error(`Failed to connect to server: ${error.message}`);
  }
};

// Defines the main component
const HeadsetBookingSystem = () => {
  // State management
  const [availableHeadsets, setAvailableHeadsets] = useState(0);
  const [totalHeadsets, setTotalHeadsets] = useState(0);
  const [unavailableHeadsets, setUnavailableHeadsets] = useState(0);
  const [allHeadsets, setAllHeadsets] = useState([]);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userBooking, setUserBooking] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);

  // connection info and timestap of last update
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Mock user ID (in real app, get from auth context)
  const userId = 1;

  // Initialize socket connection
  useEffect(() => {
    // Connects to a websocket server
    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5006', {
      transports: ['websocket', 'polling']
    });

    // Marks as active telling the user its connected
    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      socketInstance.emit('user_connected', userId);
    });

    // Marks as disconnected
    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    // Listen for real-time updates
    // When backend announces a headset was booked -> refresh API data & update UI
    socketInstance.on('headset_booked', (data) => {
      console.log('Headset booked:', data);
      fetchHeadsetData();
      fetchRecentActivity();
      setLastUpdated(new Date());
    });

    // same for returns
    socketInstance.on('headset_returned', (data) => {
      console.log('Headset returned:', data);
      fetchHeadsetData();
      fetchRecentActivity();
      setLastUpdated(new Date());
    });

    // save the socket state
    setSocket(socketInstance);

    // cleanup: disconnects when the component unmounts
    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  // Fetch headset data from API
  // Fetch all the functions stats at once using Promise.all
  const fetchHeadsetData = async () => {
    try {
      setIsLoading(true);
      const [availableRes, totalRes, unavailableRes, allRes] = await Promise.all([
        api.getAvailableHeadsets(),
        api.getTotalHeadsets(),
        api.getUnavailableHeadsets(),
        api.getAllHeadsets()
      ]);

      // updates react state from responses
      if (availableRes.total !== undefined) setAvailableHeadsets(availableRes.total);
      if (totalRes.total !== undefined) setTotalHeadsets(totalRes.total);
      if (unavailableRes.total !== undefined) setUnavailableHeadsets(unavailableRes.total);
      if (allRes.headsets) setAllHeadsets(allRes.headsets);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching headset data:", error);
      setBookingStatus({
        type: 'error',
        message: 'Failed to fetch headset data. Please check if the server is running.'
      });
      // Set default values to prevent UI errors
      setAvailableHeadsets(0);
      setTotalHeadsets(0);
      setUnavailableHeadsets(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recent activity
  // Loads the recent headset requests, formats them for display
  const fetchRecentActivity = async () => {
    try {
      const response = await api.getRecentRequests(10);
      if (response.requests) {
        const formattedBookings = response.requests.map(request => ({
          id: `${request.user_id}-${Date.now()}`,
          name: request.username,
          time: new Date(request.requested_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          timestamp: request.requested_at,
          status: request.status
        }));
        setRecentBookings(formattedBookings);
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      // Set empty array instead of letting it fail completely
      setRecentBookings([]);
    }
  };

  // Initial data fetch
  
  useEffect(() => {
    fetchHeadsetData();
    fetchRecentActivity();
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHeadsetData();
      fetchRecentActivity();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Clear status messages after 5 seconds
  useEffect(() => {
    if (bookingStatus) {
      const timer = setTimeout(() => {
        setBookingStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [bookingStatus]);

  // Handle instant booking
  const handleInstantBooking = async () => {
    setIsLoading(true);
    setBookingStatus(null);

    try {
      // Check if headsets are available
      if (availableHeadsets <= 0) {
        setBookingStatus({
          type: 'error',
          message: 'No headsets available. Please try again later.'
        });
        return;
      }

      // Find an available headset
      const availableHeadset = allHeadsets.find(headset => headset.is_available);

      if (!availableHeadset) {
        setBookingStatus({
          type: 'error',
          message: 'No available headsets found. Please refresh the page.'
        });
        return;
      }

      // Book the headset
      const response = await api.bookHeadset(userId, availableHeadset.id);

      if (response.message && response.message.includes('successfully')) {
        const booking = {
          id: response.bookingId,
          headsetId: availableHeadset.id,
          station: availableHeadset.station || `VR-${availableHeadset.id}`,
          timestamp: new Date().toISOString(),
          timeBooked: new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        };

        setUserBooking(booking);
        setBookingStatus({
          type: 'success',
          message: 'Headset booked successfully!'
        });

        // Emit socket event
        if (socket) {
          socket.emit('headset_booked', {
            userId,
            headsetId: availableHeadset.id,
            timestamp: new Date().toISOString()
          });
        }

        // Refresh data
        await fetchHeadsetData();
        await fetchRecentActivity();
      } else {
        setBookingStatus({
          type: 'error',
          message: response.message || 'Failed to book headset. Please try again.'
        });
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingStatus({
        type: 'error',
        message: 'Connection error. Please check your internet connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle headset return
  const handleReturn = async () => {
    if (!userBooking) return;

    setIsLoading(true);

    try {
      const response = await api.returnHeadset(userId, userBooking.headsetId);

      if (response.message && response.message.includes('successfully')) {
        setUserBooking(null);
        setBookingStatus({
          type: 'success',
          message: 'Thank you! Headset returned successfully.'
        });

        // Emit socket event
        if (socket) {
          socket.emit('headset_returned', {
            userId,
            headsetId: userBooking.headsetId,
            timestamp: new Date().toISOString()
          });
        }

        // Refresh data
        await fetchHeadsetData();
        await fetchRecentActivity();
      } else {
        setBookingStatus({
          type: 'error',
          message: response.message || 'Failed to return headset. Please try again.'
        });
      }
    } catch (error) {
      console.error('Return error:', error);
      setBookingStatus({
        type: 'error',
        message: 'Connection error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get availability class based on percentage
  const getAvailabilityClass = () => {
    if (totalHeadsets === 0) return 'availability-low';
    const percentage = (availableHeadsets / totalHeadsets) * 100;
    if (percentage > 60) return 'availability-high';
    if (percentage > 30) return 'availability-medium';
    return 'availability-low';
  };

  // Get availability status information
  const getAvailabilityStatus = () => {
    if (totalHeadsets === 0) return { text: 'Loading...', icon: 'fa-spinner fa-spin', class: 'text-secondary' };

    const percentage = (availableHeadsets / totalHeadsets) * 100;
    if (percentage > 60) return { text: 'Excellent availability', icon: 'fa-check-circle', class: 'text-success' };
    if (percentage > 30) return { text: 'Limited availability', icon: 'fa-clock', class: 'text-warning' };
    if (percentage > 0) return { text: 'Very limited', icon: 'fa-exclamation-triangle', class: 'text-danger' };
    return { text: 'Fully booked', icon: 'fa-ban', class: 'text-secondary' };
  };

  const availabilityInfo = getAvailabilityStatus();

  return (
    <div className="container-fluid py-5" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div className="row mb-5">
          <div className="col-12 text-center">
            <h1 className="display-4 fw-bold mb-3">
              <span className="gradient-text">Request A Headset</span>
            </h1>
            <p className="lead text-medium fs-5 mb-2">
              Request headset and get an immediate response
            </p>
            <div className="text-soft small">
              <i className={`fas ${isConnected ? 'fa-wifi text-success' : 'fa-wifi-slash text-danger'} me-2`}></i>
              {isConnected ? 'Connected' : 'Disconnected'} • Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Live Availability */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="modern-card p-4 p-md-5">
              <div className="row align-items-center mb-4">
                <div className="col-md-6">
                  <h2 className="h3 fw-bold text-strong mb-0">
                    <i className="fas fa-users icon-primary me-3"></i>
                    Live Availability
                  </h2>
                  <p className="text-soft mb-0 mt-1">Real-time headset status</p>
                </div>
                <div className="col-md-6 text-md-end mt-3 mt-md-0">
                  <span className="badge badge-success badge-modern">
                    <span className="pulse-dot me-2"></span>
                    Live Updates
                  </span>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-md-4 text-center">
                  <div className={`availability-circle ${getAvailabilityClass()} mb-3 floating-animation`}>
                    <div>
                      <div className="display-3 fw-bold">{availableHeadsets}</div>
                      <small className="opacity-90">Available</small>
                    </div>
                  </div>
                  <div className={`fw-semibold ${availabilityInfo.class}`}>
                    <i className={`fas ${availabilityInfo.icon} me-2`}></i>
                    {availabilityInfo.text}
                  </div>
                </div>

                <div className="col-md-8">
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <div className="stats-card">
                        <div className="h3 text-strong fw-bold mb-1">{unavailableHeadsets}</div>
                        <div className="text-soft small">Currently in use</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stats-card">
                        <div className="h3 fw-bold mb-1" style={{ color: 'var(--primary-blue)' }}>{totalHeadsets}</div>
                        <div className="text-soft small">Total headsets</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="d-flex justify-content-between text-medium mb-2">
                      <span className="fw-medium">Availability</span>
                      <span className="fw-bold">
                        {totalHeadsets > 0 ? Math.round((availableHeadsets / totalHeadsets) * 100) : 0}%
                      </span>
                    </div>
                    <div className="modern-progress mb-3">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${totalHeadsets > 0 ? (availableHeadsets / totalHeadsets) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-soft small">
                      <i className="fas fa-sync-alt me-2"></i>
                      Updates automatically via WebSocket
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Action */}
        {!userBooking ? (
          <div className="row mb-5">
            <div className="col-12">
              <div className="modern-card p-4 p-md-5 text-center">
                <h2 className="display-6 fw-bold text-strong mb-3">Request your headset now!</h2>
                <p className="lead text-medium mb-5">
                  One click is all it takes. No forms to fill out.
                </p>

                <button
                  onClick={handleInstantBooking}
                  disabled={isLoading || availableHeadsets === 0 || !isConnected}
                  className={`btn btn-lg px-5 py-3 ${availableHeadsets === 0 || !isConnected
                    ? 'btn-light'
                    : 'modern-btn'
                    }`}
                  style={availableHeadsets === 0 || !isConnected ? { backgroundColor: 'var(--gray-300)', color: 'var(--gray-500)' } : {}}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner-modern"></div>
                      Reserving your headset...
                    </>
                  ) : !isConnected ? (
                    <>
                      <i className="fas fa-wifi-slash me-2"></i>
                      Connection lost
                    </>
                  ) : availableHeadsets === 0 ? (
                    <>
                      <i className="fas fa-pause-circle me-2"></i>
                      All headsets in use
                    </>
                  ) : (
                    <>
                      <i className="fas fa-play-circle me-2"></i>
                      Reserve headset now
                    </>
                  )}
                </button>

                {(availableHeadsets === 0 || !isConnected) && (
                  <div className={`alert mt-4 ${!isConnected ? 'alert-danger-modern' : 'alert-warning-modern'}`}>
                    <i className={`fas ${!isConnected ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2`}></i>
                    <strong>{!isConnected ? 'Connection Issue:' : 'Tip:'}</strong>
                    {!isConnected
                      ? ' Please check your internet connection and refresh the page.'
                      : ' Sessions typically last 15-30 minutes. Check back shortly for availability.'
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="row mb-5">
            <div className="col-12">
              <div className="booking-card-success p-4 p-md-5">
                <div className="text-center mb-4">
                  <i className="fas fa-check-circle fa-3x icon-success mb-3"></i>
                  <h2 className="display-6 fw-bold text-strong">You're all set!</h2>
                  <p className="text-medium">Your headset has been reserved</p>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="stats-card">
                      <div className="fw-bold text-primary">Station</div>
                      <div className="h4 mb-0">{userBooking.station}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="stats-card">
                      <div className="fw-bold text-primary">Time Booked</div>
                      <div className="h4 mb-0">{userBooking.timeBooked}</div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="lead text-medium mb-4">
                    <i className="fas fa-location-dot icon-warning me-2"></i>
                    Please proceed to the lecturer's hub to receive your headset.
                  </p>

                  <button
                    onClick={handleReturn}
                    disabled={isLoading}
                    className="btn danger-btn btn-lg px-4 py-3"
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner-modern"></div>
                        Processing return...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-out-alt me-2"></i>
                        Return headset
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {bookingStatus && (
          <div className="row mb-4">
            <div className="col-12">
              <div className={`alert alert-modern ${bookingStatus.type === 'success' ? 'alert-success-modern' : 'alert-danger-modern'}`}>
                <div className="d-flex align-items-center">
                  <i className={`fas ${bookingStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-3 fs-5`}></i>
                  <div className="fw-semibold">{bookingStatus.message}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Activity */}
        <div className="row">
          <div className="col-12">
            <div className="modern-card p-4 p-md-5">
              <div className="row align-items-center mb-4">
                <div className="col-md-6">
                  <h3 className="h4 fw-bold text-strong mb-0">
                    <i className="fas fa-activity icon-primary me-3"></i>
                    Recent activity
                  </h3>
                  <p className="text-soft mb-0 mt-1">Live booking updates</p>
                </div>
                <div className="col-md-6 text-md-end mt-3 mt-md-0">
                  <span className="badge badge-primary badge-modern">
                    <i className="fas fa-pulse me-1"></i>
                    Real-time ({recentBookings.length})
                  </span>
                </div>
              </div>

              <div>
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking, index) => (
                    <div
                      key={booking.id}
                      className={`activity-item ${index === 0 ? 'activity-new' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            <i className={`fas ${booking.status === 'returned' ? 'fa-sign-out-alt icon-danger' : 'fa-user icon-success'}`}></i>
                          </div>
                          <div>
                            <div className="fw-semibold text-strong">{booking.name}</div>
                            <div className="text-soft small">
                              {booking.status === 'returned' ? 'Returned headset' : 'Booked headset'}
                            </div>
                            {index === 0 && (
                              <span className="badge badge-success badge-modern" style={{ fontSize: '0.75rem' }}>
                                Latest
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-soft small">{booking.time}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-history fa-2x icon-soft mb-3"></i>
                    <p className="text-soft">No recent activity</p>
                    <small className="text-soft">Activity will appear here in real-time</small>
                  </div>
                )}
              </div>

              <div className="text-center mt-4">
                <div className="text-soft small">
                  <i className={`fas ${isConnected ? 'fa-sync-alt' : 'fa-exclamation-triangle'} me-2`}></i>
                  {isConnected ? 'Activity updates automatically' : 'Reconnecting...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="row mt-5">
            <div className="col-12">
              <div className="alert alert-info">
                <h6>Debug Information:</h6>
                <small>
                  <strong>API Base URL:</strong> {API_BASE_URL}<br />
                  <strong>Socket Connected:</strong> {isConnected ? 'Yes' : 'No'}<br />
                  <strong>User ID:</strong> {userId}<br />
                  <strong>Available/Total:</strong> {availableHeadsets}/{totalHeadsets}<br />
                  <strong>Last Updated:</strong> {lastUpdated.toLocaleString()}
                </small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadsetBookingSystem;