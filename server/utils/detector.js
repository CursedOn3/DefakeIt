const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Run DeepFake detection on an image using Python model
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<object>} Detection result
 */
const runDetection = (imagePath) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        // Path to the detection project
        const detectionProjectPath = process.env.DETECTION_PROJECT_PATH || 
            'D:/Coding/img/DeepFake-Detection-for-Image';
        
        // Python script path
        const pythonScript = path.join(__dirname, '..', '..', 'python', 'detect.py');
        
        // Model path
        const modelPath = process.env.MODEL_PATH || 
            path.join(detectionProjectPath, 'models', 'deepfake_detector.h5');
        
        // Check if model exists
        if (!fs.existsSync(modelPath)) {
            return reject(new Error(`Model not found at: ${modelPath}`));
        }
        
        // Python command
        const pythonPath = process.env.PYTHON_PATH || 'python';
        
        console.log(`🔍 Running detection on: ${imagePath}`);
        console.log(`📦 Using model: ${modelPath}`);
        
        // Spawn Python process
        const pythonProcess = spawn(pythonPath, [
            pythonScript,
            '--image', imagePath,
            '--model', modelPath,
            '--project', detectionProjectPath
        ]);
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            const processingTime = Date.now() - startTime;
            
            if (code !== 0) {
                console.error('Python error:', errorOutput);
                return reject(new Error(`Detection failed: ${errorOutput || 'Unknown error'}`));
            }
            
            try {
                // Parse JSON output from Python
                const result = JSON.parse(output.trim());
                result.processingTime = processingTime;
                resolve(result);
            } catch (e) {
                console.error('Failed to parse Python output:', output);
                reject(new Error('Failed to parse detection result'));
            }
        });
        
        pythonProcess.on('error', (err) => {
            reject(new Error(`Failed to start Python process: ${err.message}`));
        });
    });
};

/**
 * Run DeepFake detection on a video using Python model
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<object>} Detection result with frame analysis
 */
const runVideoDetection = (videoPath) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        // Path to the detection project
        const detectionProjectPath = process.env.DETECTION_PROJECT_PATH || 
            'D:/Coding/img/DeepFake-Detection-for-Image';
        
        // Python script path
        const pythonScript = path.join(__dirname, '..', '..', 'python', 'detect.py');
        
        // Model path
        const modelPath = process.env.MODEL_PATH || 
            path.join(detectionProjectPath, 'models', 'deepfake_detector.h5');
        
        // Check if model exists
        if (!fs.existsSync(modelPath)) {
            return reject(new Error(`Model not found at: ${modelPath}`));
        }
        
        // Python command
        const pythonPath = process.env.PYTHON_PATH || 'python';
        
        console.log(`🎬 Running video detection on: ${videoPath}`);
        console.log(`📦 Using model: ${modelPath}`);
        
        // Spawn Python process with --video flag
        const pythonProcess = spawn(pythonPath, [
            pythonScript,
            '--video', videoPath,
            '--model', modelPath,
            '--project', detectionProjectPath
        ]);
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            const processingTime = Date.now() - startTime;
            
            if (code !== 0) {
                console.error('Python error:', errorOutput);
                return reject(new Error(`Video detection failed: ${errorOutput || 'Unknown error'}`));
            }
            
            try {
                // Parse JSON output from Python
                const result = JSON.parse(output.trim());
                result.processingTime = processingTime;
                resolve(result);
            } catch (e) {
                console.error('Failed to parse Python output:', output);
                reject(new Error('Failed to parse video detection result'));
            }
        });
        
        pythonProcess.on('error', (err) => {
            reject(new Error(`Failed to start Python process: ${err.message}`));
        });
    });
};

/**
 * Run DeepFake detection on audio using Python model
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<object>} Detection result
 */
const runAudioDetection = (audioPath) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        // Python script path for audio detection
        const pythonScript = path.join(__dirname, '..', '..', 'python', 'detect_audio.py');
        
        // Check if script exists
        if (!fs.existsSync(pythonScript)) {
            return reject(new Error(`Audio detection script not found at: ${pythonScript}`));
        }
        
        // Python command
        const pythonPath = process.env.PYTHON_PATH || 'python';
        
        console.log(`🎵 Running audio detection on: ${audioPath}`);
        
        // Spawn Python process
        const pythonProcess = spawn(pythonPath, [
            pythonScript,
            audioPath
        ]);
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            const processingTime = Date.now() - startTime;
            
            if (code !== 0) {
                console.error('Python error:', errorOutput);
                return reject(new Error(`Audio detection failed: ${errorOutput || 'Unknown error'}`));
            }
            
            try {
                // Parse JSON output from Python
                const result = JSON.parse(output.trim());
                result.processingTime = result.processingTime || processingTime;
                resolve(result);
            } catch (e) {
                console.error('Failed to parse Python output:', output);
                reject(new Error('Failed to parse audio detection result'));
            }
        });
        
        pythonProcess.on('error', (err) => {
            reject(new Error(`Failed to start Python process: ${err.message}`));
        });
    });
};

module.exports = { runDetection, runVideoDetection, runAudioDetection };