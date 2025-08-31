const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.origin.includes('localhost') ? 'http:http://localhost:5006/api' : window.location.origin + '/api');

const fetchWithErrorHandling = (url, options = {}) => {
    try {
        const response = await fetch(url, options);
        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        };
        return response.json();
    } catch (error) {
        console.error(`API call failed for ${url}:`, error);
        throw new Error(`HTTP error! status: ${response.status}`)
    }
}

const api = {
    getAvailableHeadset: () => 
}