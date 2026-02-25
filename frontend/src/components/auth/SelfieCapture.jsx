import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { requestCameraAccess, detectFace, compareFaces } from '../../services/faceVerification';

export default function SelfieCapture({ idDescriptor, onMatch, isDark }) {
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [stream, setStream] = useState(null);
  const [result, setResult] = useState(null);
  const [autoDetectStatus, setAutoDetectStatus] = useState(''); // Status text for auto-detection
  const [faceDetected, setFaceDetected] = useState(false);
  const [failCount, setFailCount] = useState(0); // Track failed verification attempts
  const autoDetectRef = useRef(null); // interval ref
  const hasSubmittedRef = useRef(false); // prevent double submit
  const lastSimilarityRef = useRef(0); // store last similarity for registrar submit

  useEffect(() => {
    // Cleanup camera and intervals on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (autoDetectRef.current) {
        clearInterval(autoDetectRef.current);
      }
    };
  }, [stream]);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      console.log('📷 Requesting camera access...');
      const cameraResult = await requestCameraAccess();

      if (!cameraResult.success) {
        setResult({
          success: false,
          message: cameraResult.error
        });
        return;
      }

      // Set video stream
      if (videoRef.current) {
        videoRef.current.srcObject = cameraResult.stream;
        setStream(cameraResult.stream);
        setCameraActive(true);
        hasSubmittedRef.current = false;
        console.log('✅ Camera started!');

        // Start auto-detection after a brief delay for camera to warm up
        setTimeout(() => {
          startAutoDetection();
        }, 1500);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setResult({
        success: false,
        message: 'Failed to access camera. Please check permissions.'
      });
    }
  };

  const startAutoDetection = useCallback(() => {
    console.log('🔄 Starting auto face detection...');
    setAutoDetectStatus('Looking for your face...');

    // Check for face every 800ms for faster response
    autoDetectRef.current = setInterval(async () => {
      if (!videoRef.current || hasSubmittedRef.current) return;

      try {
        // detectFace returns descriptor — we reuse it in performCapture to avoid double detection
        const faceResult = await detectFace(videoRef.current);

        if (faceResult.success) {
          setFaceDetected(true);
          setAutoDetectStatus('Face detected! Verifying...');

          // Stop the interval to prevent duplicate captures
          clearInterval(autoDetectRef.current);
          autoDetectRef.current = null;

          // Pass the already-detected descriptor directly — no need to detect again
          await performCapture(faceResult.descriptor);
        } else {
          setFaceDetected(false);
          setAutoDetectStatus('Position your face in the circle...');
        }
      } catch (err) {
        console.log('Auto-detect cycle error:', err);
      }
    }, 800);
  }, []);

  const performCapture = async (selfieDescriptor) => {
    if (!videoRef.current || !cameraActive || hasSubmittedRef.current) return;

    setCapturing(true);
    setResult(null);
    hasSubmittedRef.current = true;

    try {
      console.log('📸 Auto-capturing selfie...');

      // Use the descriptor passed from auto-detect (already detected, no need to re-detect)
      let descriptor = selfieDescriptor;
      if (!descriptor) {
        // Fallback: detect if called without descriptor
        const selfieFaceResult = await detectFace(videoRef.current);
        if (!selfieFaceResult.success) {
          setResult({ success: false, message: selfieFaceResult.error });
          hasSubmittedRef.current = false;
          startAutoDetection();
          setCapturing(false);
          return;
        }
        descriptor = selfieFaceResult.descriptor;
      }

      console.log('✅ Face descriptor ready — comparing...');

      // Compare with ID photo face (instant — just math, no detection)
      const comparison = compareFaces(idDescriptor, descriptor);

      if (!comparison.success) {
        setResult({
          success: false,
          message: comparison.error
        });
        hasSubmittedRef.current = false;
        startAutoDetection();
        setCapturing(false);
        return;
      }

      const similarity = comparison.similarity;
      const isMatch = comparison.isMatch;

      console.log(`📊 Similarity: ${similarity.toFixed(2)}%`);

      // Track failed attempts
      if (!isMatch) {
        setFailCount(prev => prev + 1);
        lastSimilarityRef.current = similarity;
      }

      setResult({
        success: true,
        similarity: similarity,
        isMatch: isMatch,
        message: isMatch
          ? `✅ Face verified! ${similarity.toFixed(1)}% match`
          : `⚠️ Face doesn't match. ${similarity.toFixed(1)}% match (need 90%)`
      });

      // Pass result to parent only if match
      if (isMatch) {
        onMatch(isMatch, similarity);
      }

      // Only stop camera if match is >= 90% (auto-approved)
      // Otherwise keep camera for retake option
      if (isMatch && stream) {
        stream.getTracks().forEach(track => track.stop());
        setCameraActive(false);
      }

    } catch (error) {
      console.error('Selfie capture error:', error);
      setResult({
        success: false,
        message: 'Error capturing selfie. Please try again.'
      });
      hasSubmittedRef.current = false;
      startAutoDetection();
    } finally {
      setCapturing(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setFaceDetected(false);
    hasSubmittedRef.current = false;
    setAutoDetectStatus('Looking for your face...');

    if (cameraActive) {
      // Camera still running, just restart detection
      startAutoDetection();
    } else {
      // Camera was stopped, restart it
      startCamera();
    }
  };

  const handleManualCapture = async () => {
    if (!videoRef.current || !cameraActive || hasSubmittedRef.current) return;
    // Stop auto-detection to prevent race condition
    if (autoDetectRef.current) {
      clearInterval(autoDetectRef.current);
      autoDetectRef.current = null;
    }
    setAutoDetectStatus('Capturing...');
    // Call performCapture without descriptor — it will detect face fresh
    await performCapture();
  };

  const handleSubmitToRegistrar = () => {
    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
    if (autoDetectRef.current) {
      clearInterval(autoDetectRef.current);
      autoDetectRef.current = null;
    }
    // Submit with the last similarity score — backend will set pending_review
    onMatch(false, lastSimilarityRef.current);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-8 rounded-3xl ${isDark ? 'bg-slate-800/50' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'} shadow-xl`}
      >
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'} flex items-center justify-center mx-auto mb-4`}>
            <svg className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Live Face Verification
          </h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Position your face in the circle — it will capture automatically
          </p>
        </div>

        {/* Video Preview */}
        <div className={`relative rounded-2xl overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-gray-100'} mb-6`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-[400px] object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror effect
          />

          {!cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <svg className={`w-20 h-20 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Camera not started
                </p>
              </div>
            </div>
          )}

          {/* Face detection overlay - animated border */}
          {cameraActive && !result && (
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-80 rounded-full border-4 transition-colors duration-500 ${capturing
                ? 'border-yellow-400 animate-pulse'
                : faceDetected
                  ? 'border-green-400 animate-pulse'
                  : 'border-white/50'
                }`} />
            </div>
          )}

          {/* Auto-detect status overlay */}
          {cameraActive && !result && (
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${capturing
                ? 'bg-yellow-500/80 text-white'
                : faceDetected
                  ? 'bg-green-500/80 text-white'
                  : 'bg-black/50 text-white'
                }`}>
                {capturing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying face...
                  </>
                ) : (
                  <>
                    <span className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-300 animate-pulse' : 'bg-red-400'}`} />
                    {autoDetectStatus || 'Starting camera...'}
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-center mb-6">
          {!cameraActive && !result && (
            <button
              onClick={startCamera}
              className={`px-8 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${isDark
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Start Camera
            </button>
          )}
          {cameraActive && !result && !capturing && (
            <button
              onClick={handleManualCapture}
              className={`px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 shadow-lg ${isDark
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/25'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/25'
                }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capture Now
            </button>
          )}
        </div>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${result.success && result.isMatch
              ? isDark
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-green-50 border-green-200 text-green-800'
              : isDark
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-red-50 border-red-200 text-red-800'
              }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {result.success && result.isMatch ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{result.message}</p>
                {result.similarity !== undefined && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Similarity Score</span>
                      <span className="font-bold">{result.similarity.toFixed(1)}%</span>
                    </div>
                    <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full rounded-full transition-all ${result.isMatch ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${Math.min(result.similarity, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Retake & Submit buttons - shows after result */}
        {result && (
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {/* Retake button - always show if not matched */}
            {!result.isMatch && (
              <button
                onClick={handleRetake}
                className={`px-6 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 ${isDark
                  ? 'bg-slate-600 hover:bg-slate-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retake Selfie ({3 - failCount} left)
              </button>
            )}

            {/* Submit to Registrar button - shows after 3 failed attempts */}
            {failCount >= 3 && !result.isMatch && (
              <button
                onClick={handleSubmitToRegistrar}
                className={`px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 shadow-lg ${isDark
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Submit to Registrar
              </button>
            )}
          </div>
        )}

        {/* Fail count warning */}
        {failCount > 0 && failCount < 3 && result && !result.isMatch && (
          <p className={`text-center text-sm mt-2 font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'
            }`}>
            Attempt {failCount}/3 — {3 - failCount} {3 - failCount === 1 ? 'try' : 'tries'} remaining before registrar review
          </p>
        )}

        {/* Max attempts reached message */}
        {failCount >= 3 && result && !result.isMatch && (
          <div className={`text-center mt-3 p-3 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'
            }`}>
            <p className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'
              }`}>
              ⚠️ Maximum attempts reached
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-amber-400/70' : 'text-amber-600'
              }`}>
              You can still retake or submit your application to the Registrar for manual approval.
            </p>
          </div>
        )}

        {/* Tips */}
        <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
          <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            📌 Tips for best results:
          </p>
          <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>• Face will be captured automatically when detected</li>
            <li>• Or click "Capture Now" to manually trigger verification</li>
            <li>• Ensure good lighting on your face</li>
            <li>• Look directly at the camera</li>
            <li>• Remove glasses if possible</li>
            <li>• Keep your face centered in the circle</li>
            <li className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>• Maximum of 3 attempts — after that, submit to the Registrar for manual review</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
