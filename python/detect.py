"""
DeepFake Detection Bridge Script
Connects the MERN web app to the Python detection model
"""

import sys
import os
import json
import argparse
import tempfile
import shutil

# Suppress TensorFlow warnings BEFORE importing tensorflow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TF logging
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import warnings
warnings.filterwarnings('ignore')

# Redirect stderr to suppress any remaining warnings during import
import io
old_stderr = sys.stderr
sys.stderr = io.StringIO()

def detect_image(image_path, model_path, project_path):
    """
    Run deepfake detection on an image
    
    Args:
        image_path: Path to the image file
        model_path: Path to the trained model
        project_path: Path to the DeepFake detection project
    
    Returns:
        dict: Detection result
    """
    # Add project path to sys.path
    if project_path not in sys.path:
        sys.path.insert(0, project_path)
    
    try:
        # Import from the detection project
        from src.inference import DeepfakeInference
        
        # Suppress stdout temporarily to catch print statements
        old_stdout = sys.stdout
        sys.stdout = io.StringIO()
        
        # Initialize detector
        detector = DeepfakeInference(model_path)
        
        # Run detection
        result = detector.predict_single_image(image_path, verbose=False)
        
        # Restore stdout
        sys.stdout = old_stdout
        
        if result is None:
            return {
                'success': False,
                'error': 'Failed to process image',
                'prediction': 'error',
                'confidence': 0
            }
        
        # Format output
        output = {
            'success': True,
            'prediction': result.get('prediction', 'unknown'),
            'confidence': float(result.get('confidence', 0) * 100),  # Convert to percentage
            'raw_score': float(result.get('probability', 0)),
            'is_fake': result.get('prediction', '').lower() == 'fake',
            'model': os.path.basename(model_path)
        }
        
        return output
        
    except ImportError as e:
        # Fallback: Use simple TensorFlow loading
        return detect_with_tensorflow(image_path, model_path)
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'prediction': 'error',
            'confidence': 0
        }

def detect_with_tensorflow(image_path, model_path):
    """
    Fallback detection using direct TensorFlow model loading
    """
    try:
        import numpy as np
        from tensorflow.keras.models import load_model
        from tensorflow.keras.preprocessing.image import load_img, img_to_array
        
        # Load model
        model = load_model(model_path)
        
        # Get input shape from model
        input_shape = model.input_shape[1:3]  # (height, width)
        
        # Load and preprocess image
        img = load_img(image_path, target_size=input_shape)
        img_array = img_to_array(img)
        img_array = img_array / 255.0  # Normalize
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        
        # Predict
        prediction = model.predict(img_array, verbose=0)
        
        # Get probability (assuming binary classification)
        prob = float(prediction[0][0]) if prediction.shape[-1] == 1 else float(prediction[0][1])
        
        # Determine class
        is_fake = prob >= 0.5
        confidence = prob if is_fake else (1 - prob)
        
        return {
            'success': True,
            'prediction': 'fake' if is_fake else 'real',
            'confidence': confidence * 100,
            'raw_score': prob,
            'is_fake': is_fake,
            'model': os.path.basename(model_path)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'prediction': 'error',
            'confidence': 0
        }


def extract_frames(video_path, output_dir, frame_interval=30, max_frames=20):
    """
    Extract frames from video for analysis
    
    Args:
        video_path: Path to the video file
        output_dir: Directory to save extracted frames
        frame_interval: Extract every Nth frame (default: 30, roughly 1 per second for 30fps)
        max_frames: Maximum number of frames to extract (default: 20)
    
    Returns:
        list: Paths to extracted frame images
    """
    try:
        import cv2
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            return []
        
        frame_paths = []
        frame_count = 0
        extracted_count = 0
        
        # Get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # Calculate optimal interval to get max_frames evenly distributed
        if total_frames > 0:
            optimal_interval = max(1, total_frames // max_frames)
            frame_interval = max(frame_interval, optimal_interval)
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Extract frame at interval
            if frame_count % frame_interval == 0 and extracted_count < max_frames:
                frame_path = os.path.join(output_dir, f'frame_{extracted_count:04d}.jpg')
                cv2.imwrite(frame_path, frame)
                frame_paths.append(frame_path)
                extracted_count += 1
            
            frame_count += 1
        
        cap.release()
        
        return frame_paths
        
    except ImportError:
        raise ImportError("OpenCV (cv2) is required for video processing. Install with: pip install opencv-python")
    except Exception as e:
        raise e


def detect_video(video_path, model_path, project_path):
    """
    Run deepfake detection on a video by analyzing extracted frames
    
    Args:
        video_path: Path to the video file
        model_path: Path to the trained model
        project_path: Path to the DeepFake detection project
    
    Returns:
        dict: Detection result with frame analysis
    """
    temp_dir = None
    
    try:
        import cv2
        
        # Create temporary directory for frames
        temp_dir = tempfile.mkdtemp(prefix='deepfake_frames_')
        
        # Get video properties
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0
        cap.release()
        
        # Extract frames
        frame_paths = extract_frames(video_path, temp_dir, frame_interval=30, max_frames=20)
        
        if not frame_paths:
            return {
                'success': False,
                'error': 'Failed to extract frames from video',
                'prediction': 'error',
                'confidence': 0
            }
        
        # Analyze each frame
        frame_results = []
        fake_count = 0
        real_count = 0
        total_confidence = 0
        
        for i, frame_path in enumerate(frame_paths):
            result = detect_image(frame_path, model_path, project_path)
            
            frame_result = {
                'frame_number': i + 1,
                'prediction': result.get('prediction', 'error'),
                'confidence': result.get('confidence', 0),
                'is_fake': result.get('is_fake', False)
            }
            frame_results.append(frame_result)
            
            if result.get('success', False):
                total_confidence += result.get('confidence', 0)
                if result.get('is_fake', False):
                    fake_count += 1
                else:
                    real_count += 1
        
        # Calculate overall result
        analyzed_count = fake_count + real_count
        
        if analyzed_count == 0:
            return {
                'success': False,
                'error': 'No frames could be analyzed',
                'prediction': 'error',
                'confidence': 0
            }
        
        # Determine if video is fake (majority voting)
        is_fake = fake_count > real_count
        
        # Calculate average confidence
        avg_confidence = total_confidence / analyzed_count if analyzed_count > 0 else 0
        
        # Adjust confidence based on consensus
        # If all frames agree, boost confidence; if mixed, reduce it
        consensus_ratio = max(fake_count, real_count) / analyzed_count
        adjusted_confidence = avg_confidence * consensus_ratio
        
        return {
            'success': True,
            'prediction': 'fake' if is_fake else 'real',
            'confidence': adjusted_confidence,
            'is_fake': is_fake,
            'total_frames': total_frames,
            'analyzed_frames': analyzed_count,
            'fake_frames': fake_count,
            'real_frames': real_count,
            'duration_seconds': duration,
            'fps': fps,
            'frame_results': frame_results,
            'model': os.path.basename(model_path)
        }
        
    except ImportError as e:
        return {
            'success': False,
            'error': f'Missing dependency: {str(e)}',
            'prediction': 'error',
            'confidence': 0
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'prediction': 'error',
            'confidence': 0
        }
    finally:
        # Clean up temporary directory
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

def main():
    # Restore stderr for argument parsing errors
    sys.stderr = old_stderr
    
    parser = argparse.ArgumentParser(description='DeepFake Detection')
    parser.add_argument('--image', help='Path to image file')
    parser.add_argument('--video', help='Path to video file')
    parser.add_argument('--model', required=True, help='Path to model file')
    parser.add_argument('--project', default='', help='Path to detection project')
    
    args = parser.parse_args()
    
    # Suppress stderr again during processing
    sys.stderr = io.StringIO()
    
    # Check that either image or video is provided
    if not args.image and not args.video:
        sys.stderr = old_stderr
        result = {'success': False, 'error': 'Either --image or --video must be provided'}
        print(json.dumps(result))
        sys.exit(1)
    
    # Validate model path
    if not os.path.exists(args.model):
        sys.stderr = old_stderr
        result = {'success': False, 'error': f'Model not found: {args.model}'}
        print(json.dumps(result))
        sys.exit(1)
    
    # Run detection based on input type
    if args.video:
        # Video detection
        if not os.path.exists(args.video):
            sys.stderr = old_stderr
            result = {'success': False, 'error': f'Video not found: {args.video}'}
            print(json.dumps(result))
            sys.exit(1)
        
        result = detect_video(args.video, args.model, args.project)
    else:
        # Image detection
        if not os.path.exists(args.image):
            sys.stderr = old_stderr
            result = {'success': False, 'error': f'Image not found: {args.image}'}
            print(json.dumps(result))
            sys.exit(1)
        
        result = detect_image(args.image, args.model, args.project)
    
    # Restore stderr before output
    sys.stderr = old_stderr
    
    # Output JSON result (only this should go to stdout)
    print(json.dumps(result))
    
    # Exit with appropriate code
    sys.exit(0 if result.get('success', False) else 1)

if __name__ == '__main__':
    main()
