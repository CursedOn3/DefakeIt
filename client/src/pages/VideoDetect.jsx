import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiVideo, FiUploadCloud, FiAlertCircle, FiPlay, FiX, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

function VideoDetect() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [frameResults, setFrameResults] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      handleFileSelect(file);
    } else {
      setError('Please upload a valid video file (MP4, AVI, MOV, MKV)');
    }
  };

  const handleFileSelect = (file) => {
    // Validate file type
    const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|avi|mov|mkv|webm)$/i)) {
      setError('Please upload a valid video file (MP4, AVI, MOV, MKV, WebM)');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('Video file size must be less than 100MB');
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setError(null);
    setFrameResults([]);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setError(null);
    setFrameResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeVideo = async () => {
    if (!videoFile) return;

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    setStatus('Uploading video...');
    setFrameResults([]);

    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      const response = await api.post('/detect/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 30) / progressEvent.total);
          setProgress(percentCompleted);
          if (percentCompleted >= 30) {
            setStatus('Processing video frames...');
          }
        },
      });

      if (response.data.success) {
        const result = response.data.data;
        setFrameResults(result.frameResults || []);
        
        // Navigate to video result page
        navigate('/result', {
          state: {
            result: {
              isFake: result.isFake,
              confidence: result.confidence,
              prediction: result.prediction,
              totalFrames: result.totalFrames,
              analyzedFrames: result.analyzedFrames,
              fakeFrames: result.fakeFrames,
              realFrames: result.realFrames,
              processingTime: result.processingTime,
              originalName: videoFile.name,
              isVideo: true,
              frameResults: result.frameResults,
            },
            videoUrl: videoPreview,
            isVideo: true,
          },
        });
      } else {
        setError(response.data.error || 'Failed to analyze video');
      }
    } catch (err) {
      console.error('Video analysis error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to analyze video. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-purple-100 rounded-full">
              <FiVideo className="text-5xl text-purple-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Video DeepFake Detection
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a video to analyze it for potential deepfake manipulation. 
            Our system extracts frames and analyzes each one using AI.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Video Uploader */}
          {!videoFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
                ${isDragging 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleInputChange}
                className="hidden"
              />
              <FiUploadCloud className={`text-6xl mx-auto mb-4 ${isDragging ? 'text-purple-500' : 'text-gray-400'}`} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {isDragging ? 'Drop video here' : 'Upload Video'}
              </h3>
              <p className="text-gray-500 mb-4">
                Drag and drop a video file or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Supported formats: MP4, AVI, MOV, MKV, WebM (Max 100MB)
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video
                  src={videoPreview}
                  controls
                  className="w-full max-h-96 object-contain"
                />
                <button
                  onClick={clearVideo}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Video Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <FiVideo className="text-2xl text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-800">{videoFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={analyzeVideo}
                  disabled={isAnalyzing}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPlay className="text-xl" />
                  <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Video'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{status}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-gray-500 mt-4 text-sm">
                Extracting and analyzing video frames. This may take a few minutes...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
              <FiAlertCircle className="text-red-500 text-xl flex-shrink-0" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* How It Works */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">How Video Detection Works</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-gray-800 mb-1">Extract Frames</h4>
                <p className="text-sm text-gray-600">
                  Video is processed to extract key frames at regular intervals
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-gray-800 mb-1">Analyze Each Frame</h4>
                <p className="text-sm text-gray-600">
                  Each frame is analyzed by our deep learning model
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-gray-800 mb-1">Aggregate Results</h4>
                <p className="text-sm text-gray-600">
                  Results are combined to give overall video authenticity score
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoDetect;
