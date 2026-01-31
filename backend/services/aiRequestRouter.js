/**
 * AI-POWERED REQUEST CLASSIFICATION & AUTOMATED ROUTING SERVICE
 * 
 * This module implements intelligent request classification and automated workflow routing.
 * Currently uses rule-based logic, but structured for future ML model integration.
 * 
 * Features:
 * - Automatic request type classification
 * - Intelligent office/admin assignment
 * - Priority level determination
 * - Workflow stage prediction
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * AI-BASED REQUEST CLASSIFIER
 * Analyzes request details and automatically determines:
 * - Request category
 * - Required processing stages
 * - Initial assigned office
 * - Priority level
 * 
 * @param {Object} requestData - The request submission data
 * @returns {Object} Classification result with routing information
 */
async function classifyAndRouteRequest(requestData) {
  const { doc_type_id, student_id, request_details } = requestData;

  try {
    // Step 1: Fetch document type information
    const { data: docType, error: docError } = await supabase
      .from('document_types')
      .select('*')
      .eq('id', doc_type_id)
      .single();

    if (docError) throw docError;

    // Step 2: Fetch student profile for context
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('course_year, student_number')
      .eq('id', student_id)
      .single();

    if (studentError) throw studentError;

    // Step 3: AI CLASSIFICATION LOGIC
    // This is where ML model would be integrated in the future
    const classification = await performIntelligentClassification({
      docType,
      student,
      requestDetails: request_details
    });

    // Step 4: AUTOMATED ROUTING
    const routing = await determineOptimalRouting(classification, docType);

    // Step 5: Log AI decision for audit trail
    await logAIDecision({
      student_id,
      doc_type_id,
      classification,
      routing,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      classification,
      routing,
      aiProcessed: true
    };

  } catch (error) {
    console.error('AI Classification Error:', error);
    return {
      success: false,
      error: error.message,
      fallbackToManual: true
    };
  }
}

/**
 * INTELLIGENT CLASSIFICATION ENGINE
 * Rule-based system with ML-ready structure
 */
async function performIntelligentClassification(context) {
  const { docType, student, requestDetails } = context;

  // Extract keywords and patterns (ML feature extraction placeholder)
  const keywords = extractKeywords(docType.name, requestDetails);
  
  // Determine request category
  const category = categorizeRequest(docType.name, keywords);
  
  // Calculate priority score (0-100)
  const priorityScore = calculatePriorityScore({
    docType,
    student,
    keywords
  });

  // Determine urgency level
  const urgency = determineUrgency(priorityScore, docType);

  return {
    category,
    priorityScore,
    urgency,
    keywords,
    confidence: 0.95, // Placeholder for ML confidence score
    processingMethod: 'rule-based' // Will be 'ml-model' in future
  };
}

/**
 * AUTOMATED ROUTING DETERMINATION
 * Assigns request to optimal office/admin based on classification
 */
async function determineOptimalRouting(classification, docType) {
  const requiredStages = docType.required_stages || [];
  
  // Determine initial stage (first office to process)
  const initialStage = requiredStages[0] || 'registrar';
  
  // Map stage to admin role
  const assignedRole = `${initialStage}_admin`;
  
  // Determine estimated processing time (in hours)
  const estimatedTime = estimateProcessingTime(classification, requiredStages.length);
  
  // Calculate recommended escalation threshold
  const escalationThreshold = Math.ceil(estimatedTime * 1.5); // 150% of estimated time

  return {
    initialStage,
    assignedRole,
    requiredStages,
    totalStages: requiredStages.length,
    estimatedProcessingTime: estimatedTime,
    escalationThreshold,
    routingStrategy: 'sequential', // Could be 'parallel' for some document types
    autoAssigned: true
  };
}

/**
 * HELPER: Extract keywords from request
 */
function extractKeywords(docTypeName, details) {
  const text = `${docTypeName} ${details || ''}`.toLowerCase();
  const keywords = [];

  // Keyword patterns for classification
  const patterns = {
    urgent: ['urgent', 'asap', 'emergency', 'immediate'],
    academic: ['transcript', 'grades', 'diploma', 'certificate'],
    financial: ['payment', 'fee', 'tuition', 'scholarship'],
    clearance: ['clearance', 'exit', 'graduation', 'completion']
  };

  for (const [category, words] of Object.entries(patterns)) {
    if (words.some(word => text.includes(word))) {
      keywords.push(category);
    }
  }

  return keywords;
}

/**
 * HELPER: Categorize request type
 */
function categorizeRequest(docTypeName, keywords) {
  const name = docTypeName.toLowerCase();
  
  if (name.includes('clearance')) return 'clearance';
  if (name.includes('transcript') || name.includes('grades')) return 'academic_records';
  if (name.includes('certificate') || name.includes('diploma')) return 'certification';
  if (name.includes('id') || name.includes('card')) return 'identification';
  
  return 'general';
}

/**
 * HELPER: Calculate priority score (0-100)
 */
function calculatePriorityScore(context) {
  let score = 50; // Base score

  // Adjust based on keywords
  if (context.keywords.includes('urgent')) score += 30;
  if (context.keywords.includes('clearance')) score += 20;
  if (context.keywords.includes('academic')) score += 10;

  // Adjust based on document type complexity
  const stageCount = context.docType.required_stages?.length || 1;
  score += Math.min(stageCount * 5, 20); // More stages = higher priority

  return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
}

/**
 * HELPER: Determine urgency level
 */
function determineUrgency(priorityScore, docType) {
  if (priorityScore >= 80) return 'critical';
  if (priorityScore >= 60) return 'high';
  if (priorityScore >= 40) return 'medium';
  return 'low';
}

/**
 * HELPER: Estimate processing time in hours
 */
function estimateProcessingTime(classification, stageCount) {
  const baseTime = 24; // 24 hours base
  const timePerStage = 12; // 12 hours per stage
  
  let estimatedTime = baseTime + (stageCount * timePerStage);
  
  // Adjust based on urgency
  if (classification.urgency === 'critical') estimatedTime *= 0.5;
  else if (classification.urgency === 'high') estimatedTime *= 0.75;
  
  return Math.ceil(estimatedTime);
}

/**
 * HELPER: Log AI decision for audit and training
 */
async function logAIDecision(decisionData) {
  try {
    await supabase.from('ai_routing_logs').insert({
      student_id: decisionData.student_id,
      doc_type_id: decisionData.doc_type_id,
      classification: decisionData.classification,
      routing: decisionData.routing,
      timestamp: decisionData.timestamp
    });
  } catch (error) {
    console.error('Failed to log AI decision:', error);
    // Non-critical error, don't throw
  }
}

/**
 * GET ROUTING STATISTICS
 * For admin dashboard and system monitoring
 */
async function getRoutingStatistics(timeRange = '7d') {
  try {
    const { data, error } = await supabase
      .from('ai_routing_logs')
      .select('*')
      .gte('timestamp', getTimeRangeStart(timeRange));

    if (error) throw error;

    return {
      totalProcessed: data.length,
      averageConfidence: calculateAverageConfidence(data),
      categoryDistribution: getCategoryDistribution(data),
      urgencyDistribution: getUrgencyDistribution(data)
    };
  } catch (error) {
    console.error('Failed to get routing statistics:', error);
    return null;
  }
}

function getTimeRangeStart(range) {
  const now = new Date();
  const days = parseInt(range) || 7;
  now.setDate(now.getDate() - days);
  return now.toISOString();
}

function calculateAverageConfidence(logs) {
  if (!logs.length) return 0;
  const sum = logs.reduce((acc, log) => acc + (log.classification?.confidence || 0), 0);
  return (sum / logs.length).toFixed(2);
}

function getCategoryDistribution(logs) {
  const distribution = {};
  logs.forEach(log => {
    const category = log.classification?.category || 'unknown';
    distribution[category] = (distribution[category] || 0) + 1;
  });
  return distribution;
}

function getUrgencyDistribution(logs) {
  const distribution = {};
  logs.forEach(log => {
    const urgency = log.classification?.urgency || 'unknown';
    distribution[urgency] = (distribution[urgency] || 0) + 1;
  });
  return distribution;
}

module.exports = {
  classifyAndRouteRequest,
  getRoutingStatistics
};
