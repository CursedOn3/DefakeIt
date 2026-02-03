# Audio Deepfake Detection Feature

This document describes the audio deepfake detection feature integration in the DeepFake Web App.

## Overview

The audio deepfake detection feature uses a hybrid CNN-LSTM architecture with self-attention mechanisms to detect synthetic audio. It integrates with the existing audio-deepfake-detection project located at `D:\Final Year Project\audio-deepfake-detection`.

## Architecture

### Backend Components

1. **Python Detection Script** (`python/detect_audio.py`)
   - Interfaces with the audio-deepfake-detection model
   - Uses the DeepfakeDetector class from the audio project
   - Processes audio files and returns detection results in JSON format

2. **Upload Middleware** (`server/middleware/upload.js`)
   - Added `uploadAudio` multer configuration
   - Accepts audio formats: MP3, WAV, OGG, FLAC, M4A, AAC
   - Maximum file size: 20MB

3. **Detection Controller** (`server/controllers/detectController.js`)
   - `detectAudio` function handles audio file uploads
   - Calls Python detection script
   - Supports Cloudflare R2 storage integration
   - Saves results to MongoDB

4. **Detection Utility** (`server/utils/detector.js`)
   - `runAudioDetection` function spawns Python process
   - Passes audio file path to detection script
   - Parses JSON output from Python

5. **Routes** (`server/routes/detect.js`)
   - POST `/api/detect/audio` - Upload and detect deepfake in audio

6. **Database Model** (`server/models/Detection.js`)
   - Added audio-specific fields:
     - `audioPath`: Local file path
     - `audioUrl`: Public URL (R2 or local)
     - `audioSize`: File size in bytes
     - `isAudio`: Boolean flag
     - `audioMetadata`: Threshold and other metadata

### Frontend Components

1. **AudioDetect Page** (`client/src/pages/AudioDetect.jsx`)
   - Drag-and-drop audio upload interface
   - Audio preview player
   - File validation (format and size)
   - Progress tracking during analysis
   - Error handling

2. **API Service** (`client/src/services/api.js`)
   - `detectAudio` function for API calls
   - Upload progress tracking
   - Error handling

3. **Result Page** (`client/src/pages/Result.jsx`)
   - Updated to display audio results
   - Audio player for analyzed files
   - Confidence scores and processing time

4. **Navigation** (`client/src/components/Navbar.jsx`)
   - Added "Audio" navigation link
   - Music icon (FiMusic)

5. **Landing Page** (`client/src/pages/Landing.jsx`)
   - Added "Detect Audio" call-to-action button
   - Updated description to include audio detection

## Audio Model Details

The audio deepfake detection uses the following model:
- **Model Path**: `D:\Final Year Project\audio-deepfake-detection\models\deepfake_detector.keras`
- **Architecture**: Multi-scale CNN with Bidirectional LSTM and Self-Attention
- **Input**: Audio files (resampled to 16kHz)
- **Features**: MFCCs, log-mel spectrograms
- **Output**: Binary classification (real/fake) with confidence score
- **Default Threshold**: 0.5

### Detection Process

1. Audio file is uploaded via the web interface
2. Backend receives file and saves to uploads directory
3. Python script is spawned with audio file path
4. Audio is preprocessed:
   - Resampled to 16kHz
   - MFCC features extracted
   - Log-mel spectrogram computed
   - Normalized and padded to 256 timesteps
5. Model performs inference
6. Results returned as JSON with:
   - `prediction`: 'real' or 'fake'
   - `confidence`: Confidence percentage (0-100)
   - `raw_score`: Raw probability (0-1)
   - `is_deepfake`: Boolean
   - `processing_time`: Time in milliseconds

## Setup Instructions

### Prerequisites

1. Python environment with required packages:
   ```bash
   pip install tensorflow>=2.13.0 librosa>=0.10.0 numpy>=1.24.0 scipy>=1.10.0 scikit-learn>=1.3.0 matplotlib>=3.7.0 pyyaml>=6.0 soundfile>=0.12.0
   ```

2. Audio deepfake detection project at:
   `D:\Final Year Project\audio-deepfake-detection`

3. Trained model at:
   `D:\Final Year Project\audio-deepfake-detection\models\deepfake_detector.keras`

### Environment Variables

Add to `.env` file:
```
MAX_AUDIO_SIZE=20971520  # 20MB in bytes
```

### Running the Application

1. Start the backend server:
   ```bash
   cd server
   npm start
   ```

2. Start the frontend:
   ```bash
   cd client
   npm run dev
   ```

3. Navigate to `/detect-audio` to use the audio detection feature

## API Usage

### Detect Audio Deepfake

**Endpoint**: `POST /api/detect/audio`

**Request**:
- Method: POST
- Content-Type: multipart/form-data
- Body: FormData with 'audio' field containing the audio file

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "64abc123...",
    "filename": "uuid.mp3",
    "originalName": "sample.mp3",
    "prediction": "fake",
    "confidence": 87.5,
    "rawScore": 0.8234,
    "isFake": true,
    "audioUrl": "https://r2.example.com/uuid.mp3",
    "storageType": "r2",
    "processingTime": 2345.67,
    "thresholdUsed": 0.5,
    "message": "⚠️ This audio appears to be a DEEPFAKE!"
  }
}
```

## Supported Audio Formats

- MP3 (audio/mpeg)
- WAV (audio/wav)
- OGG (audio/ogg)
- FLAC (audio/flac)
- M4A (audio/m4a)
- AAC (audio/aac)

## File Size Limits

- Maximum audio file size: 20MB
- Can be configured via `MAX_AUDIO_SIZE` environment variable

## Future Enhancements

1. **Batch Processing**: Upload and analyze multiple audio files
2. **Advanced Analytics**: Show spectrogram visualizations
3. **XAI Integration**: Grad-CAM and SHAP visualizations
4. **Transformer Models**: Support for more advanced architectures
5. **Real-time Detection**: Stream audio for live analysis
6. **Speaker Verification**: Additional voice authentication features

## Troubleshooting

### Python Script Errors
- Ensure audio-deepfake-detection project path is correct
- Verify model file exists at specified path
- Check Python dependencies are installed
- Verify Python path in environment

### Upload Errors
- Check file format is supported
- Verify file size is under 20MB
- Ensure uploads directory has write permissions

### Detection Errors
- Check model file is accessible
- Verify TensorFlow is properly installed
- Check audio file is not corrupted
- Ensure sufficient system memory

## Credits

Audio deepfake detection model based on the audio-deepfake-detection project with hybrid CNN-LSTM architecture and self-attention mechanisms.
