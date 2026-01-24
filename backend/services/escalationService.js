// Escalation Service - Auto-escalate stalled requests
const supabase = require('../supabaseClient');
const { notifyRequestEscalated } = require('./notificationService');

/**
 * Check and escalate pending requests
 */
async function checkAndEscalateRequests() {
  try {
    const escalationDays = parseInt(process.env.ESCALATION_DAYS || '3');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - escalationDays);

    console.log(`🔍 Checking for requests pending since ${cutoffDate.toISOString()}`);

    // Get pending requests that need escalation
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*, document_types(*), profiles!requests_student_id_fkey(*)')
      .in('current_status', ['pending', 'approved'])
      .eq('is_completed', false)
      .lt('last_activity_at', cutoffDate.toISOString())
      .order('last_activity_at', { ascending: true });

    if (error) throw error;

    if (!requests || requests.length === 0) {
      console.log('✅ No requests need escalation');
      return { success: true, escalated: 0 };
    }

    console.log(`⚠️ Found ${requests.length} requests needing escalation`);

    let escalatedCount = 0;

    for (const request of requests) {
      try {
        // Calculate days pending
        const daysPending = Math.floor(
          (new Date() - new Date(request.last_activity_at)) / (1000 * 60 * 60 * 24)
        );

        // Determine escalation level
        let escalationLevel = request.escalation_level || 0;
        escalationLevel += 1;

        // Update request
        const { error: updateError } = await supabase
          .from('requests')
          .update({
            escalated: true,
            escalated_at: new Date().toISOString(),
            escalation_level: escalationLevel
          })
          .eq('id', request.id);

        if (updateError) throw updateError;

        // Log escalation history
        const { error: historyError } = await supabase
          .from('escalation_history')
          .insert({
            request_id: request.id,
            escalation_level: escalationLevel,
            escalated_by: 'system',
            reason: `Request pending for ${daysPending} days without action`
          });

        if (historyError) throw historyError;

        // Send notification
        await notifyRequestEscalated(request.id, escalationLevel, daysPending);

        escalatedCount++;
        console.log(`✅ Escalated request ${request.id} to level ${escalationLevel}`);

      } catch (error) {
        console.error(`❌ Error escalating request ${request.id}:`, error);
      }
    }

    return {
      success: true,
      escalated: escalatedCount,
      total: requests.length
    };

  } catch (error) {
    console.error('❌ Escalation check error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get escalation statistics
 */
async function getEscalationStats() {
  try {
    // Total escalated requests
    const { count: totalEscalated } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('escalated', true);

    // Escalated by level
    const { data: byLevel } = await supabase
      .from('requests')
      .select('escalation_level')
      .eq('escalated', true);

    const levelCounts = {};
    byLevel?.forEach(req => {
      const level = req.escalation_level || 0;
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    // Recent escalations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentEscalations } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('escalated', true)
      .gte('escalated_at', sevenDaysAgo.toISOString());

    return {
      success: true,
      stats: {
        totalEscalated,
        byLevel: levelCounts,
        recentEscalations
      }
    };

  } catch (error) {
    console.error('Error getting escalation stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Manually escalate a request
 */
async function manuallyEscalateRequest(requestId, adminId, reason) {
  try {
    // Get request
    const { data: request, error: reqError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqError) throw reqError;

    // Calculate days pending
    const daysPending = Math.floor(
      (new Date() - new Date(request.last_activity_at)) / (1000 * 60 * 60 * 24)
    );

    // Determine escalation level
    let escalationLevel = request.escalation_level || 0;
    escalationLevel += 1;

    // Update request
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        escalated: true,
        escalated_at: new Date().toISOString(),
        escalation_level: escalationLevel
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Log escalation history
    const { error: historyError } = await supabase
      .from('escalation_history')
      .insert({
        request_id: requestId,
        escalation_level: escalationLevel,
        escalated_by: adminId,
        reason: reason || `Manually escalated by admin`
      });

    if (historyError) throw historyError;

    // Send notification
    await notifyRequestEscalated(requestId, escalationLevel, daysPending);

    return {
      success: true,
      message: 'Request escalated successfully'
    };

  } catch (error) {
    console.error('Error manually escalating request:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  checkAndEscalateRequests,
  getEscalationStats,
  manuallyEscalateRequest
};
