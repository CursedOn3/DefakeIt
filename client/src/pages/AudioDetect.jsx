import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectAudio } from '../services/api';
import { FiMusic, FiAlertCircle, FiUploadCloud, FiX } from 'react-icons/fi';

function AudioDetect() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);

  const acceptedFormats = '.mp3,.wav,.ogg,.flac,.m4a,.aac';

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const validateAndSetFile = (file) => {
    // Check file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac', 'audio/m4a', 'audio/aac'];
    const validExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
    const fileExtension = file.name.toLowerCase().match(/\.[^.]*$/)?.[0];
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('Please select a valid audio file (MP3, WAV, OGG, FLAC, M4A, or AAC)');
      return;
    }

    // Check file size (20MB max)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Audio file size must be less than 20MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    
    // Create audio preview
    const audioUrl = URL.createObjectURL(file);
    setAudioPreview(audioUrl);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
      setAudioPreview(null);
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    try {
      const response = await detectAudio(selectedFile, (prog) => {
        setProgress(prog);
      });

      const resultData = {
        isFake: response.data.isFake,
        confidence: response.data.confidence,
        rawScore: response.data.rawScore,
        processingTime: response.data.processingTime,
        originalName: selectedFile.name,
        isAudio: true,
        audioUrl: response.data.audioUrl,
        thresholdUsed: response.data.thresholdUsed,
      };

      // Navigate to result page with data
      navigate('/result', { 
        state: { 
          result: resultData, 
          audioUrl: audioPreview,
          isAudio: true
        } 
      });
    } catch (err) {
      setError(err.error || err.message || 'Failed to analyze audio. Please try again.');
      console.error('Upload error:', err);
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-purple-100 rounded-full">
              <FiMusic className="text-5xl text-purple-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Audio DeepFake Detection
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload an audio file to analyze it for potential deepfake manipulation. 
            Our AI-powered system uses advanced deep learning to detect synthetic audio.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Audio Uploader */}
          {!selectedFile ? (
            <div
              className="border-3 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUploadCloud className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-700 mb-2">
                Drop your audio file here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supported formats: MP3, WAV, OGG, FLAC, M4A, AAC (Max 20MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File Info */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiMusic className="text-purple-600 text-2xl" />
                  <div>
                    <p className="font-medium text-gray-800">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={isAnalyzing}
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {/* Audio Preview */}
              {audioPreview && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <audio controls className="w-full">
                    <source src={audioPreview} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Analyze Button */}
              {!isAnalyzing && (
                <button
                  onClick={handleUpload}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  Analyze Audio for Deepfakes
                </button>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Analyzing audio...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-gray-500 mt-4 text-sm">
                Running deep learning model to detect audio manipulation...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <FiAlertCircle className="text-red-500 text-xl flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              How it works
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Upload your audio file in supported formats</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Our AI analyzes spectral patterns and audio features</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Get instant results showing if the audio is authentic or synthetic</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Uses CNN-LSTM architecture with self-attention mechanisms</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioDetect;
