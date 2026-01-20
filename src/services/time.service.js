
const getLocalDate = () => {
    const now = new Date();
    return new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
};

/**
 * Calcule la durée entre deux dates et renvoie une chaîne formatée HH:MM:SS.
 * @param {Date|string} start
 * @param {Date|string} end
 * @returns {string} 
 */
const calculateDuration = (start, end) => {
    if (!start || !end) return "N/A";
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const diff = endDate - startDate; 
    
    if (diff < 0) return "00:00:00";

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor(diff / (1000 * 60 * 60));

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
};

module.exports = {
    getLocalDate,
    calculateDuration
};