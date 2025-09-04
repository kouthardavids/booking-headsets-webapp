import db from '../config/db.js';

// Create a request - linking to the headsets table by id and booking it 
export const createRequest = async (userId, headsetId) => {
  const [result] = await db.query(
    'INSERT INTO requests (user_id, headset_id, status, requested_at) VALUES (?, ?, ?, NOW())',
    [userId, headsetId, 'borrowed']
  );
  return result.insertId; // This returns the auto-increment ID
};


// Check if the user has booked for the day
export const hasUserBooked = async (userId) => {
  const [rows] = await db.query(
    `SELECT * FROM requests 
     WHERE user_id = ? 
       AND DATE(requested_at) = CURDATE()
       AND status = 'borrowed'`,
    [userId]
  );

  return rows.length > 0;
};

// Update the status in the request table to borrowed or returned for the request history
export const updateStatus = async (userId, headsetId) => {
  const [result] = await db.query(
    `UPDATE requests
    SET status = 'returned', returned_at = NOW()
    WHERE user_id = ? AND headset_id = ? AND status = 'borrowed'`, 
    [userId, headsetId]
  );
  return result.affectedRows > 0;
};

// Fetch all requests
export const fetchAllRequests = async () => {
  try {
    const [result] = await db.query(
      `SELECT r.id as request_id, r.user_id, r.headset_id, r.status, 
              r.requested_at, r.returned_at, 
              u.username, h.station AS headset_name
       FROM requests r
       JOIN users u ON r.user_id = u.user_id
       JOIN headsets h ON r.headset_id = h.id
       ORDER BY r.requested_at DESC`
    );

    return result;

  } catch (error) {
    console.error('Error fetching all requests:', error);
    throw error;
  }
};

// Fetch request activity but limited
export const fetchLimitedRequests = async (limit = 5) => {
  try {
    const [result] = await db.query(
      `SELECT r.id as request_id, r.user_id, r.requested_at, r.status, u.username
      FROM requests r
      JOIN users u ON r.user_id = u.user_id
      ORDER BY r.requested_at DESC
      LIMIT ?`, 
      [limit]
    );

    return result;
  } catch (error) {
    console.error('Error fetching limited requests:', error);
    throw error;
  }
};