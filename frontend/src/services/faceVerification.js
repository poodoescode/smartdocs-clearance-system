/**
 * Face Verification Service
 * Uses face-api.js for face detection and comparison
 */

import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Load face-api.js models (only once)
 */
export async function loadFaceModels() {
  if (modelsLoaded) {
    console.log('✅ Models already loaded');
    return true;
  }

  try {
    console.log('📥 Loading face detection models...');
    
    const MODEL_URL = '/models';
    
    // Load required models
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    
    modelsLoaded = true;
    console.log('✅ Face detection models loaded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error loading face models:', error);
    throw new Error('Failed to load face detection models. Please refresh the page.');
  }
}

/**
 * Detect face in an image and extract face descriptor
 * @param {File|HTMLImageElement|HTMLVideoElement} input - Image source
 * @returns {Object} Face detection result with descriptor
 */
export async function detectFace(input) {
  try {
    // Ensure models are loaded
    if (!modelsLoaded) {
      await loadFaceModels();
    }

    console.log('👤 Detecting face...');

    // Convert File to Image if needed
    let imageElement = input;
    if (input instanceof File) {
      imageElement = await faceapi.bufferToImage(input);
    }

    // Detect face with landmarks and descriptor
    const detection = await faceapi
      .detectSingleFace(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return {
        success: false,
        error: 'No face detected. Please ensure your face is clearly visible.'
      };
    }

    console.log('✅ Face detected successfully!');

    return {
      success: true,
      descriptor: detection.descriptor,
      detection: detection
    };
  } catch (error) {
    console.error('❌ Face detection error:', error);
    return {
      success: false,
      error: 'Error detecting face. Please try again.'
    };
  }
}

/**
 * Compare two face descriptors and calculate similarity
 * @param {Float32Array} descriptor1 - First face descriptor (from ID)
 * @param {Float32Array} descriptor2 - Second face descriptor (from selfie)
 * @returns {Object} Comparison result with similarity percentage
 */
export function compareFaces(descriptor1, descriptor2) {
  try {
    if (!descriptor1 || !descriptor2) {
      return {
        success: false,
        error: 'Invalid face descriptors'
      };
    }

    // Calculate Euclidean distance between face descriptors
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    
    // Convert distance to similarity percentage
    // Distance ranges from 0 (identical) to ~1.5 (very different)
    // We convert to 0-100% scale
    const similarity = Math.max(0, Math.min(100, (1 - distance) * 100));

    console.log(`📊 Face similarity: ${similarity.toFixed(2)}%`);

    // Determine if faces match (90% threshold)
    const isMatch = similarity >= 90;

    return {
      success: true,
      similarity: similarity,
      isMatch: isMatch,
      distance: distance,
      threshold: 90
    };
  } catch (error) {
    console.error('❌ Face comparison error:', error);
    return {
      success: false,
      error: 'Error comparing faces. Please try again.'
    };
  }
}

/**
 * Complete face verification process
 * @param {File} idPhoto - Student ID photo
 * @param {HTMLVideoElement} videoElement - Live video element for selfie
 * @returns {Object} Verification result
 */
export async function verifyFace(idPhoto, videoElement) {
  try {
    // Step 1: Detect face in ID photo
    console.log('🔍 Step 1: Detecting face in ID photo...');
    const idFaceResult = await detectFace(idPhoto);
    
    if (!idFaceResult.success) {
      return {
        success: false,
        step: 'id_detection',
        error: idFaceResult.error
      };
    }

    // Step 2: Detect face in live selfie
    console.log('🔍 Step 2: Detecting face in live selfie...');
    const selfieFaceResult = await detectFace(videoElement);
    
    if (!selfieFaceResult.success) {
      return {
        success: false,
        step: 'selfie_detection',
        error: selfieFaceResult.error
      };
    }

    // Step 3: Compare faces
    console.log('🔍 Step 3: Comparing faces...');
    const comparisonResult = compareFaces(
      idFaceResult.descriptor,
      selfieFaceResult.descriptor
    );

    if (!comparisonResult.success) {
      return {
        success: false,
        step: 'comparison',
        error: comparisonResult.error
      };
    }

    // Step 4: Return final result
    return {
      success: true,
      similarity: comparisonResult.similarity,
      isMatch: comparisonResult.isMatch,
      verified: comparisonResult.isMatch,
      autoApprove: comparisonResult.isMatch,
      message: comparisonResult.isMatch
        ? `✅ Face verified! ${comparisonResult.similarity.toFixed(1)}% match`
        : `⚠️ Face verification failed. ${comparisonResult.similarity.toFixed(1)}% match (need 90%)`
    };
  } catch (error) {
    console.error('❌ Face verification error:', error);
    return {
      success: false,
      error: 'Verification failed. Please try again.'
    };
  }
}

/**
 * Check if browser supports camera access
 */
export function isCameraSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Request camera access
 */
export async function requestCameraAccess() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      } 
    });
    return {
      success: true,
      stream: stream
    };
  } catch (error) {
    console.error('❌ Camera access error:', error);
    return {
      success: false,
      error: 'Camera access denied. Please allow camera access to continue.'
    };
  }
}
