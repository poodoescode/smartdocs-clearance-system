// Certificate Generation Service
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabaseClient');

/**
 * Generate certificate number
 */
function generateCertificateNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `CERT-${year}-${random}`;
}

/**
 * Generate verification code
 */
function generateVerificationCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Generate clearance certificate PDF
 */
async function generateCertificate(requestId) {
  try {
    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        document_types(*),
        profiles!requests_student_id_fkey(*)
      `)
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;

    // Check if request is completed
    if (!request.is_completed) {
      throw new Error('Request is not completed yet');
    }

    // Check if certificate already exists
    const { data: existingCert, error: certCheckError } = await supabase
      .from('clearance_certificates')
      .select('*')
      .eq('request_id', requestId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no results

    // Ignore "no rows" error, but throw other errors
    if (certCheckError && certCheckError.code !== 'PGRST116') {
      throw certCheckError;
    }

    if (existingCert) {
      return {
        success: true,
        certificate: existingCert,
        message: 'Certificate already exists'
      };
    }

    const student = request.profiles;
    const docType = request.document_types;

    // Generate certificate data
    const certificateNumber = generateCertificateNumber();
    const verificationCode = generateVerificationCode();
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Buffer to store PDF
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Generate QR code for verification
    const qrCodeData = `${process.env.SUPABASE_URL}/verify/${verificationCode}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    // PDF Header - Green border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(3)
       .strokeColor('#28a745')
       .stroke();

    // Logo/Header
    doc.fontSize(28)
       .fillColor('#28a745')
       .font('Helvetica-Bold')
       .text('SmartDocs', 0, 80, { align: 'center' });

    doc.fontSize(14)
       .fillColor('#666')
       .font('Helvetica')
       .text('Digital Document Request & Clearance System', 0, 115, { align: 'center' });

    // Certificate Title
    doc.moveDown(2);
    doc.fontSize(32)
       .fillColor('#212529')
       .font('Helvetica-Bold')
       .text('CLEARANCE CERTIFICATE', 0, 180, { align: 'center' });

    // Decorative line
    doc.moveTo(150, 230)
       .lineTo(doc.page.width - 150, 230)
       .strokeColor('#28a745')
       .lineWidth(2)
       .stroke();

    // Certificate Body
    doc.moveDown(3);
    doc.fontSize(14)
       .fillColor('#212529')
       .font('Helvetica')
       .text('This is to certify that', 0, 260, { align: 'center' });

    doc.fontSize(24)
       .fillColor('#28a745')
       .font('Helvetica-Bold')
       .text(student.full_name, 0, 290, { align: 'center' });

    doc.fontSize(12)
       .fillColor('#666')
       .font('Helvetica')
       .text(`Student Number: ${student.student_number}`, 0, 325, { align: 'center' });

    doc.text(`${student.course_year}`, 0, 345, { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(14)
       .fillColor('#212529')
       .text('has successfully completed all clearance requirements for', 0, 380, { align: 'center' });

    doc.fontSize(18)
       .fillColor('#28a745')
       .font('Helvetica-Bold')
       .text(docType.name, 0, 410, { align: 'center' });

    doc.fontSize(12)
       .fillColor('#666')
       .font('Helvetica')
       .text(`Issued on ${generatedDate}`, 0, 450, { align: 'center' });

    // Certificate Details Box
    const boxY = 500;
    doc.rect(100, boxY, doc.page.width - 200, 80)
       .fillColor('#f8f9fa')
       .fill();

    doc.fillColor('#212529')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Certificate Number:', 120, boxY + 15);
    
    doc.font('Helvetica')
       .text(certificateNumber, 120, boxY + 30);

    doc.font('Helvetica-Bold')
       .text('Verification Code:', 120, boxY + 50);
    
    doc.font('Helvetica')
       .text(verificationCode, 120, boxY + 65);

    // QR Code
    const qrSize = 60;
    const qrX = doc.page.width - 150;
    const qrY = boxY + 10;
    
    doc.image(qrCodeImage, qrX, qrY, {
      width: qrSize,
      height: qrSize
    });

    doc.fontSize(8)
       .fillColor('#666')
       .text('Scan to verify', qrX - 5, qrY + qrSize + 5);

    // Footer
    doc.fontSize(10)
       .fillColor('#666')
       .font('Helvetica-Italic')
       .text('This is a digitally generated certificate. No signature required.', 0, doc.page.height - 100, {
         align: 'center'
       });

    doc.fontSize(8)
       .text('For verification, visit smartdocs.edu/verify or scan the QR code above.', 0, doc.page.height - 80, {
         align: 'center'
       });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be generated
    const pdfBuffer = await new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Upload to Supabase Storage
    const fileName = `${certificateNumber}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clearance-certificates')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('clearance-certificates')
      .getPublicUrl(fileName);

    // Save certificate record
    const { data: certData, error: certError } = await supabase
      .from('clearance_certificates')
      .insert({
        request_id: requestId,
        certificate_number: certificateNumber,
        certificate_url: urlData.publicUrl,
        verification_code: verificationCode,
        generated_by: request.student_id
      })
      .select()
      .single();

    if (certError) throw certError;

    console.log('✅ Certificate generated:', certificateNumber);

    return {
      success: true,
      certificate: certData
    };

  } catch (error) {
    console.error('❌ Certificate generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify certificate
 */
async function verifyCertificate(verificationCode) {
  try {
    const { data, error } = await supabase
      .from('clearance_certificates')
      .select(`
        *,
        requests!clearance_certificates_request_id_fkey(
          *,
          document_types(*),
          profiles!requests_student_id_fkey(*)
        )
      `)
      .eq('verification_code', verificationCode)
      .single();

    if (error) throw error;

    return {
      success: true,
      certificate: data,
      valid: true
    };

  } catch (error) {
    return {
      success: false,
      valid: false,
      error: 'Certificate not found or invalid'
    };
  }
}

module.exports = {
  generateCertificate,
  verifyCertificate
};
