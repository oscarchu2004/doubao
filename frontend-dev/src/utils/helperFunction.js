export const formatLastEdited = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            if (diffMinutes === 0) {
                return 'just now';
            }
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        }
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
        return 'yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const diffWeeks = Math.floor(diffDays / 7);
        return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
};

export const extractImagePath = (event, folder) => {
    const file = event.target.files[0];
    if (!file) return '';

    // Return folder/filename
    return `${folder}/${file.name}`;
};

// Returns full URL for an uploaded file
export const getUploadedFileUrl = (filePath) => {
    if (!filePath) return '';
    const BASE_URL = "https://shome3-backend.hudini.online"; // backend base URL
    return `${BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};
