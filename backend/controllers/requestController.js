import { createRequest, hasUserBooked, updateStatus, fetchAllRequests, fetchLimitedRequests } from "../models/requestModel.js";
import { markHeadsetAvailable, markHeadsetUnavailable } from "../models/headsetModel.js";

// Booking a headset
export const handleBooking = async (req, res) => {
    try {
        const { userId, headsetId } = req.body;

        if (!userId || !headsetId) {
            return res.status(400).json({ message: 'User ID and Headset ID are required.' });
        }

        // Check if the person booking the headset already requested headsets before
        const checkUserAlreadyBooked = await hasUserBooked(userId);

        if (checkUserAlreadyBooked) {
            return res.status(400).json({ message: 'You have already booked a headset today.' });
        }

        // Create a booking
        const createBooking = await createRequest(userId, headsetId);

        // Mark the headset as unavailable
        const markUnavailable = await markHeadsetUnavailable(headsetId);

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.emit('headset_booked', {
                userId,
                headsetId,
                timestamp: new Date().toISOString()
            });
        }

        return res.status(200).json({
            message: 'Headset booked successfully!',
            bookingId: createBooking,
            headsetId,
            userId
        });
    } catch (error) {
        console.error('Error booking headsets:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Returning the headset
export const handleReturnHeadset = async (req, res) => {
    try {
        const { userId, headsetId } = req.body;

        if (!userId || !headsetId) {
            return res.status(400).json({ message: 'User ID and Headset ID are required.' });
        }

        // Mark headset as available
        const headsetAvailable = await markHeadsetAvailable(headsetId);

        // Update request status to returned
        const statusUpdated = await updateStatus(userId, headsetId);
        if (!statusUpdated) {
            return res.status(404).json({ message: "No active booking found for this user and headset." });
        }

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.emit('headset_returned', {
                userId,
                headsetId,
                timestamp: new Date().toISOString()
            });
        }

        return res.status(200).json({ message: "Headset returned successfully." });
    } catch (error) {
        console.error('Error returning headset:', error);
        return res.status(500).json({ message: "Server error. Could not return headset." });
    }
};

export const fetchRequests = async (req, res) => {
    try {
        const requests = await fetchAllRequests();

        if (!requests || requests.length === 0) {
            return res.status(200).json({
                message: 'No requests available.',
                requests: []
            });
        }

        return res.status(200).json({
            message: 'Fetched requests successfully',
            requests
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        return res.status(500).json({ message: "Server error. Could not fetch requests." });
    }
};

export const fetchRequestsLimit = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const requests = await fetchLimitedRequests(limit);

        if (!requests || requests.length === 0) {
            return res.status(200).json({
                message: 'No requests available.',
                requests: []
            });
        }

        return res.status(200).json({
            message: 'Fetched requests successfully',
            requests
        });

    } catch (error) {
        console.error('Error fetching requests:', error);
        return res.status(500).json({ message: "Server error. Could not limit fetch requests." });
    }
};