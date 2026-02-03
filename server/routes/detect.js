const express = require('express');
const router = express.Router();
const { upload, uploadVideo, uploadAudio } = require('../middleware/upload');
const { detectImage, detectVideo, detectAudio } = require('../controllers/detectController');

// POST /api/detect - Upload and detect deepfake in image
router.post('/', upload.single('image'), detectImage);

// POST /api/detect/video - Upload and detect deepfake in video
router.post('/video', uploadVideo.single('video'), detectVideo);

// POST /api/detect/audio - Upload and detect deepfake in audio
router.post('/audio', uploadAudio.single('audio'), detectAudio);

module.exports = router;
