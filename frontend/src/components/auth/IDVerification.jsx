import { useState } from 'react';
import { motion } from 'framer-motion';
import { verifyStudentID, validateImageQuality } from '../../services/idVerification';
import { detectFace } from '../../services/faceVerification';

export default function IDVerification({ onVerified, isDark }) {
  const [uploading, setUploading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState(null);
  const [idPhoto, setIdPhoto] = useState(null);
  const [idPreview, setIdPreview] = useState(null);

  const handleIDUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setVerificationResult(null);
    setOcrProgress(0);

    try {
      // Step 1: Validate image quality
      console.log('📸 Validating image quality...');
      const qualityCheck = await validateImageQuality(file);
      
      if (!qualityCheck.valid) {
        setVerificationResult({
          success: false,
          message: qualityCheck.error
        });
        setUploading(false);
        return;
      }

      // Step 2: Verify it's a valid ISU student ID using OCR
      console.log('🔍 Verifying ID format...');
      const idVerification = await verifyStudentID(file, (progress) => {
        setOcrProgress(progress);
      });

      if (!idVerification.success) {
        setVerificationResult({
          success: false,
          message: idVerification.error || 'Invalid ISU student ID'
        });
        setUploading(false);
        return;
      }

      console.log('✅ Valid ISU ID detected!');

      // Step 3: Detect face in ID for later comparison
      console.log('👤 Detecting face in ID...');
      const faceDetection = await detectFace(file);

      if (!faceDetection.success) {
        setVerificationResult({
          success: false,
          message: faceDetection.error || 'No face detected in ID. Please upload a clear ID photo showing your face.'
        });
        setUploading(false);
        return;
      }

      console.log('✅ Face detected in ID!');

      // Step 4: Success - both ID format and face verified
      setIdPhoto(file);
      setIdPreview(URL.createObjectURL(file));
      setVerificationResult({
        success: true,
        message: `Valid ISU ID verified! (${idVerification.confidence}% confidence)`,
        confidence: idVerification.confidence
      });

      // Pass face descriptor to parent component
      onVerified(faceDetection.descriptor);

    } catch (error) {
      console.error('ID verification error:', error);
      setVerificationResult({
        success: false,
        message: 'Error processing ID. Please try again.'
      });
    } finally {
      setUploading(false);
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
          <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center mx-auto mb-4`}>
            <svg className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Upload Your ISU Student ID
          </h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Take a clear photo of your student ID showing your face
          </p>
        </div>

        {/* Upload Area */}
        <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          isDark 
            ? 'border-slate-600 hover:border-blue-500 bg-slate-900/50' 
            : 'border-gray-300 hover:border-blue-500 bg-gray-50'
        }`}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleIDUpload(e.target.files[0])}
            disabled={uploading}
            className="hidden"
            id="id-upload"
          />
          <label
            htmlFor="id-upload"
            className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : isDark
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {uploading ? (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Choose ID Photo
              </>
            )}
          </label>

          <p className={`text-sm mt-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Supported formats: JPG, PNG • Max size: 10MB
          </p>
        </div>

        {/* OCR Progress Bar */}
        {uploading && ocrProgress > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <div className="flex justify-between text-sm mb-2">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Reading ID text...
              </span>
              <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {ocrProgress}%
              </span>
            </div>
            <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <motion.div
                className="bg-blue-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${ocrProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl border ${
              verificationResult.success
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
                {verificationResult.success ? (
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
                <p className="font-semibold">{verificationResult.message}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ID Preview */}
        {idPreview && verificationResult?.success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6"
          >
            <img
              src={idPreview}
              alt="ID Preview"
              className="w-full rounded-xl border-2 border-green-500/50 shadow-lg"
            />
            <p className={`text-center text-sm mt-3 font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              ✅ ID verified! Proceed to next step.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
