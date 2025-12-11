const express = require('express');
const router = express.Router();
const { upload, uploadVideo } = require('../middleware/upload');
const { detectImage, detectVideo } = require('../controllers/detectController');

// POST /api/detect - Upload and detect deepfake in image
router.post('/', upload.single('image'), detectImage);

// POST /api/detect/video - Upload and detect deepfake in video
router.post('/video', uploadVideo.single('video'), detectVideo);

module.exports = router;
