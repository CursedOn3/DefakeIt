const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueId}${ext}`);
    }
});

// File filter - only allow images
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// File filter - only allow videos
const videoFilter = (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm', 'video/x-msvideo'];
    const allowedExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only MP4, AVI, MOV, MKV, and WebM videos are allowed.'), false);
    }
};

// File filter - only allow audio files
const audioFilter = (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/wave', 'audio/ogg', 'audio/flac', 'audio/m4a'];
    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.wma', '.aac'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only MP3, WAV, OGG, FLAC, M4A, and AAC audio files are allowed.'), false);
    }
};

// Configure multer for images
const upload = multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
    }
});

// Configure multer for videos
const uploadVideo = multer({
    storage: storage,
    fileFilter: videoFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 100 * 1024 * 1024 // 100MB default
    }
});

// Configure multer for audio files
const uploadAudio = multer({
    storage: storage,
    fileFilter: audioFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_AUDIO_SIZE) || 20 * 1024 * 1024 // 20MB default
    }
});

module.exports = { upload, uploadVideo, uploadAudio };
