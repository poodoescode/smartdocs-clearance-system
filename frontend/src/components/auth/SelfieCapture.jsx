import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { requestCameraAccess, detectFace, compareFaces } from '../../services/faceVerification';

export default function SelfieCapture({ idDescriptor, onMatch, isDark }) {
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [stream, setStream] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Cleanup camera on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
        console.log('✅ Camera started!');
      }
    } catch (error) {
      console.error('Camera error:', error);
      setResult({
        success: false,
        message: 'Failed to access camera. Please check permissions.'
      });
    }
  };

  const captureSelfie = async () => {
    if (!videoRef.current || !cameraActive) {
      setResult({
        success: false,
        message: 'Please start the camera first.'
      });
      return;
    }

    setCapturing(true);
    setResult(null);

    try {
      console.log('📸 Capturing selfie...');

      // Detect face in live video
      const selfieFaceResult = await detectFace(videoRef.current);

      if (!selfieFaceResult.success) {
        setResult({
          success: false,
          message: selfieFaceResult.error
        });
        setCapturing(false);
        return;
      }

      console.log('✅ Face detected in selfie!');

      // Compare with ID photo face
      console.log('🔍 Comparing faces...');
      const comparison = compareFaces(idDescriptor, selfieFaceResult.descriptor);

      if (!comparison.success) {
        setResult({
          success: false,
          message: comparison.error
        });
        setCapturing(false);
        return;
      }

      const similarity = comparison.similarity;
      const isMatch = comparison.isMatch;

      console.log(`📊 Similarity: ${similarity.toFixed(2)}%`);

      setResult({
        success: true,
        similarity: similarity,
        isMatch: isMatch,
        message: isMatch
          ? `✅ Face verified! ${similarity.toFixed(1)}% match`
          : `⚠️ Face doesn't match. ${similarity.toFixed(1)}% match (need 90%)`
      });

      // Pass result to parent
      onMatch(isMatch, similarity);

      // Stop camera after successful capture
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setCameraActive(false);
      }

    } catch (error) {
      console.error('Selfie capture error:', error);
      setResult({
        success: false,
        message: 'Error capturing selfie. Please try again.'
      });
    } finally {
      setCapturing(false);
    }
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
            Take a Live Selfie
          </h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Look directly at the camera for face verification
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

          {/* Face detection overlay hint */}
          {cameraActive && !capturing && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-4 border-white/50 rounded-full" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-center mb-6">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className={`px-8 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
                isDark
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Start Camera
            </button>
          ) : (
            <button
              onClick={captureSelfie}
              disabled={capturing}
              className={`px-8 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
                capturing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isDark
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {capturing ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  Capture & Verify
                </>
              )}
            </button>
          )}
        </div>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${
              result.success && result.isMatch
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
                        className={`h-full rounded-full transition-all ${
                          result.isMatch ? 'bg-green-500' : 'bg-red-500'
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

        {/* Tips */}
        <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
          <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            📌 Tips for best results:
          </p>
          <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>• Ensure good lighting on your face</li>
            <li>• Look directly at the camera</li>
            <li>• Remove glasses if possible</li>
            <li>• Keep your face centered in the frame</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
