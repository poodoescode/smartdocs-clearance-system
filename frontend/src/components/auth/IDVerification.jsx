import { useState } from 'react';
import { motion } from 'framer-motion';
import { verifyStudentID, validateImageQuality } from '../../services/idVerification';
import { detectFace } from '../../services/faceVerification';

// Resize image to max dimension to speed up OCR and face detection
// Uses PNG (lossless) to preserve text sharpness for OCR
function resizeImage(file, maxDim = 1280) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      // If already small enough, return original
      if (img.width <= maxDim && img.height <= maxDim) {
        resolve(file);
        return;
      }
      const scale = maxDim / Math.max(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const resized = new File([blob], file.name, { type: 'image/png' });
        console.log(`📐 Resized image: ${img.width}x${img.height} → ${canvas.width}x${canvas.height} (${(file.size / 1024).toFixed(0)}KB → ${(resized.size / 1024).toFixed(0)}KB)`);
        resolve(resized);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function IDVerification({ onVerified, isDark, firstName, lastName }) {
  const [uploading, setUploading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState(''); // 'ocr' | 'face_detect'
  const [verificationResult, setVerificationResult] = useState(null);
  const [idPhoto, setIdPhoto] = useState(null);
  const [idPreview, setIdPreview] = useState(null);

  const handleIDUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setVerificationResult(null);
    setOcrProgress(0);
    setProcessingStage('ocr');

    try {
      // Step 0: Resize image for faster processing (1280px with lossless PNG for OCR quality)
      console.log('📐 Resizing image for faster processing...');
      const processFile = await resizeImage(file, 1280);

      // Yield to let UI update
      await new Promise(r => setTimeout(r, 0));

      // Step 1: Validate image quality
      console.log('📸 Validating image quality...');
      const qualityCheck = await validateImageQuality(processFile);

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
      const idVerification = await verifyStudentID(processFile, (progress) => {
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

      // Step 2.5: Verify name on ID matches the name entered in the form
      if (firstName && lastName) {
        const ocrText = (idVerification.details?.extractedText || '').toLowerCase();
        const formLastName = lastName.trim().toLowerCase();
        const formFirstName = firstName.trim().toLowerCase();

        console.log(`🔍 Checking name match - Form: "${formFirstName} ${formLastName}" vs OCR text`);
        console.log(`📝 OCR text for name check: "${ocrText}"`);

        // Check if last name appears in the OCR text (full or partial 3+ chars)
        const lastNameFound = ocrText.includes(formLastName) ||
          (formLastName.length >= 3 && ocrText.includes(formLastName.substring(0, 3)));

        // Check if first name appears in the OCR text (full or partial 3+ chars)
        const firstNameFound = ocrText.includes(formFirstName) ||
          (formFirstName.length >= 3 && ocrText.includes(formFirstName.substring(0, 3)));

        console.log(`  Last name "${formLastName}" found: ${lastNameFound ? '✅' : '❌'}`);
        console.log(`  First name "${formFirstName}" found: ${firstNameFound ? '✅' : '❌'}`);

        // Reject if NEITHER first nor last name found in the OCR text
        // This means the ID clearly belongs to someone else
        if (!lastNameFound && !firstNameFound) {
          setVerificationResult({
            success: false,
            message: `❌ Name mismatch! The name on your ID does not match "${firstName} ${lastName}". Please use your own student ID.`
          });
          setUploading(false);
          return;
        }
      }

      // Yield to let UI update with "Detecting face" message before heavy work
      setOcrProgress(100);
      setProcessingStage('face_detect');
      // requestAnimationFrame ensures the browser paints the new text, then 200ms extra buffer
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 200)));

      // Step 3: Detect face in ID for later comparison
      console.log('👤 Detecting face in ID...');
      const faceDetection = await detectFace(processFile);

      if (!faceDetection.success) {
        setVerificationResult({
          success: false,
          message: faceDetection.error || 'No face detected in ID. Please upload a clear ID photo showing your face.'
        });
        setUploading(false);
        return;
      }

      console.log('✅ Face detected in ID!');

      // Step 4: Success - both ID format, name, and face verified
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
        <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${isDark
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
            className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${uploading
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

        {/* Progress Bar */}
        {uploading && (ocrProgress > 0 || processingStage === 'face_detect') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <div className="flex justify-between text-sm mb-2">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {processingStage === 'face_detect' ? 'Detecting face in ID...' : 'Reading ID text...'}
              </span>
              <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {processingStage === 'face_detect' ? '✓' : `${ocrProgress}%`}
              </span>
            </div>
            <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <motion.div
                className={`h-full rounded-full ${processingStage === 'face_detect' ? 'bg-green-500' : 'bg-blue-500'}`}
                initial={{ width: 0 }}
                animate={{ width: processingStage === 'face_detect' ? '100%' : `${ocrProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {processingStage === 'face_detect' && (
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                This may take a few seconds...
              </p>
            )}
          </motion.div>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl border ${verificationResult.success
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
