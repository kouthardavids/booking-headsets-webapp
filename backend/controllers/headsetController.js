import {
    getTotalAvailableHeadsets,
    getTotalMarkHeadsetUnavailable,
    getTotalHeadsets,
    getAllHeadsets
} from '../models/headsetModel.js';

export const fetchTotalAvailableHeadsets = async (req, res) => {
    try {
        const availableCount = await getTotalAvailableHeadsets();

        return res.status(200).json({
            message: "Available headsets fetched successfully.",
            total: availableCount
        });

    } catch (error) {
        console.error("Error fetching available headsets:", error);
        return res.status(500).json({ 
            message: "Internal server error",
            error: error.message 
        });
    }
};

export const fetchTotalMarkHeadsetUnavailable = async (req, res) => {
    try {
        const total = await getTotalMarkHeadsetUnavailable();

        return res.status(200).json({
            message: "Unavailable headsets fetched successfully.",
            total
        });
    } catch (error) {
        console.error("Error fetching unavailable headsets:", error);
        return res.status(500).json({ 
            message: "Internal server error",
            error: error.message 
        });
    }
};

export const fetchTotalHeadsets = async (req, res) => {
    try {
        const total = await getTotalHeadsets();

        return res.status(200).json({
            message: 'Successfully fetched total amount of headsets.',
            total
        });
    } catch (error) {
        console.error("Error fetching total amount of headsets:", error);
        return res.status(500).json({ 
            message: "Internal server error.",
            error: error.message 
        });
    }
};

export const fetchAllHeadsets = async (req, res) => {
    try {
        const headsets = await getAllHeadsets();

        return res.status(200).json({
            message: 'Successfully fetched all headsets.',
            headsets
        });
    } catch (error) {
        console.error("Error fetching all headsets:", error);
        return res.status(500).json({ 
            message: "Internal server error.",
            error: error.message 
        });
    }
};