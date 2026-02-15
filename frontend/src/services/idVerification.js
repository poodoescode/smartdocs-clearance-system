/**
 * ID Verification Service
 * Uses Tesseract.js for OCR text extraction and validation
 */

import Tesseract from 'tesseract.js';

/**
 * Extract text from ID photo using OCR
 * @param {File} imageFile - ID photo file
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Object} OCR result with extracted text
 */
export async function extractTextFromID(imageFile, onProgress = null) {
  try {
    console.log('🔍 Starting OCR text extraction...');

    const { data: { text } } = await Tesseract.recognize(
      imageFile,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            console.log(`OCR Progress: ${progress}%`);
            if (onProgress) {
              onProgress(progress);
            }
          }
        }
      }
    );

    console.log('✅ OCR text extraction complete!');
    console.log('Extracted text:', text);

    return {
      success: true,
      text: text.toLowerCase(),
      rawText: text
    };
  } catch (error) {
    console.error('❌ OCR error:', error);
    return {
      success: false,
      error: 'Failed to read ID. Please upload a clear photo.'
    };
  }
}

/**
 * Verify if extracted text matches ISU student ID format
 * @param {string} extractedText - Text extracted from OCR
 * @returns {Object} Validation result with confidence score
 */
export function verifyISUStudentID(extractedText) {
  const text = extractedText.toLowerCase();
  
  console.log('🔍 Validating ISU student ID format...');

  // Check 1: Must contain "isabela state university" (35 points)
  const hasUniversityName = 
    text.includes('isabela state university') ||
    text.includes('isabela state') ||
    text.includes('isu');
  
  console.log(`Check 1 - University name: ${hasUniversityName ? '✅' : '❌'}`);

  // Check 2: Must contain "echague" (15 points)
  const hasLocation = text.includes('echague');
  
  console.log(`Check 2 - Location (Echague): ${hasLocation ? '✅' : '❌'}`);

  // Check 3: Must contain student number pattern (35 points)
  // Formats: 21-3243 (regular) or 23-3174-TS (transferee)
  const studentNumberPattern = /\d{2}-\d{4}(-[A-Z]{2})?/i;
  const hasStudentNumber = studentNumberPattern.test(extractedText);
  
  console.log(`Check 3 - Student number format: ${hasStudentNumber ? '✅' : '❌'}`);

  // Check 4: Must contain college/student keywords (15 points)
  const hasCollegeKeyword = 
    text.includes('college') ||
    text.includes('computing') ||
    text.includes('technology') ||
    text.includes('student') ||
    text.includes('information') ||
    text.includes('communication');
  
  console.log(`Check 4 - College/Student keywords: ${hasCollegeKeyword ? '✅' : '❌'}`);

  // Calculate confidence score
  let confidence = 0;
  if (hasUniversityName) confidence += 35;
  if (hasLocation) confidence += 15;
  if (hasStudentNumber) confidence += 35;
  if (hasCollegeKeyword) confidence += 15;

  console.log(`📊 Total confidence: ${confidence}%`);

  // Need at least 70% confidence to pass
  const isValid = confidence >= 70;

  return {
    isValid: isValid,
    confidence: confidence,
    checks: {
      hasUniversityName,
      hasLocation,
      hasStudentNumber,
      hasCollegeKeyword
    },
    extractedText: text,
    message: isValid
      ? `✅ Valid ISU student ID (${confidence}% confidence)`
      : `❌ Invalid ID format (${confidence}% confidence, need 70%)`
  };
}

/**
 * Complete ID verification process
 * @param {File} imageFile - ID photo file
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Object} Complete verification result
 */
export async function verifyStudentID(imageFile, onProgress = null) {
  try {
    // Step 1: Extract text using OCR
    console.log('📄 Step 1: Extracting text from ID...');
    const ocrResult = await extractTextFromID(imageFile, onProgress);

    if (!ocrResult.success) {
      return {
        success: false,
        step: 'ocr',
        error: ocrResult.error
      };
    }

    // Step 2: Verify it's an ISU student ID
    console.log('🔍 Step 2: Validating ISU ID format...');
    const verification = verifyISUStudentID(ocrResult.text);

    if (!verification.isValid) {
      return {
        success: false,
        step: 'validation',
        error: 'This does not appear to be a valid ISU student ID.',
        details: verification
      };
    }

    // Step 3: Success!
    console.log('✅ ID verification complete!');
    return {
      success: true,
      confidence: verification.confidence,
      message: verification.message,
      details: verification
    };
  } catch (error) {
    console.error('❌ ID verification error:', error);
    return {
      success: false,
      error: 'Verification failed. Please try again.'
    };
  }
}

/**
 * Validate image quality before processing
 * @param {File} imageFile - Image file to validate
 * @returns {Object} Validation result
 */
export async function validateImageQuality(imageFile) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const width = img.width;
      const height = img.height;
      const minDimension = 640;

      if (width < minDimension || height < minDimension) {
        resolve({
          valid: false,
          error: `Image too small. Minimum ${minDimension}x${minDimension} pixels required.`
        });
      } else {
        resolve({
          valid: true,
          width: width,
          height: height
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'Invalid image file.'
      });
    };

    img.src = url;
  });
}
