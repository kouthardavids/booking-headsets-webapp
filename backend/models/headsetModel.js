import db from '../config/db.js';

// Need to get all headset
export const getAllHeadsets = async () => {
    try {
        const [result] = await db.query(`SELECT * FROM headsets`);
        console.log('Headsets query result:', result);
        return result;
    } catch (error) {
        console.error('Error in getAllHeadsets:', error);
        throw error;
    }
};

// Mark headset UNAVAILABLE
export const markHeadsetUnavailable = async (id) => {
    try {
        const [result] = await db.query(
            `UPDATE headsets SET is_available = FALSE WHERE id = ?`, [id]
        );
        console.log('Mark unavailable result:', result);
    } catch (error) {
        console.error('Error in markHeadsetUnavailable:', error);
        throw error;
    }
};

// Mark headset AVAILABLE
export const markHeadsetAvailable = async (id) => {
    try {
        await db.query('UPDATE headsets SET is_available = TRUE WHERE id = ?', [id]);
        console.log('Mark available for id:', id);
    } catch (error) {
        console.error('Error in markHeadsetAvailable:', error);
        throw error;
    }
};

// Mathematical Counts
// Get the total amount of all the headsets that are available
export const getTotalAvailableHeadsets = async() => {
    try {
        const [result] = await db.query(
            `SELECT COUNT(*) AS total FROM headsets WHERE is_available = TRUE`
        );
        console.log('Available headsets count:', result[0].total);
        return result[0].total;
    } catch (error) {
        console.error('Error in getTotalAvailableHeadsets:', error);
        throw error;
    }
}

// Headsets that are currently in use and unavailable
export const getTotalMarkHeadsetUnavailable = async() => {
    try {
        const [result] = await db.query(
            `SELECT COUNT(*) AS total FROM headsets WHERE is_available = FALSE`
        );
        console.log('Unavailable headsets count:', result[0].total);
        return result[0].total;
    } catch (error) {
        console.error('Error in getTotalMarkHeadsetUnavailable:', error);
        throw error;
    }
}

// Count total amount of headset all together regardless of available or not
export const getTotalHeadsets = async () => {
    try {
        const [result] = await db.query(`SELECT COUNT(*) AS total FROM headsets`);
        console.log('Total headsets count:', result[0].total);
        return result[0].total;
    } catch (error) {
        console.error('Error in getTotalHeadsets:', error);
        throw error;
    }
}