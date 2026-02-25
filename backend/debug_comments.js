require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

(async () => {
    // Check ALL graduation requests and their view data
    const { data: reqs } = await s.from('requests').select('id, student_id').eq('clearance_type', 'graduation');

    for (const r of (reqs || [])) {
        console.log(`\n--- Request id=${r.id}, student=${r.student_id} ---`);

        // Check view for this student
        const { data: v, error: ve } = await s.from('clearance_status_view').select('request_id').eq('student_id', r.student_id).maybeSingle();
        console.log(`  View: request_id=${v?.request_id}, error=${ve?.message || 'none'}`);

        // Check comments for this request
        const { data: c } = await s.from('clearance_comments').select('id, commenter_name, comment_text').eq('clearance_request_id', r.id);
        console.log(`  Comments: ${(c || []).length}`);
        for (const cc of (c || [])) {
            console.log(`    - ${cc.commenter_name}: "${cc.comment_text}"`);
        }

        // Check approvals
        const { data: a } = await s.from('professor_approvals').select('id, professor_id, status, comments').eq('request_id', r.id);
        const chairman = (a || []).find(ap => ap.professor_id === '074f622e-6ba4-416f-bde2-910ce7f88625');
        if (chairman) {
            console.log(`  Chairman approval: id=${chairman.id}, status=${chairman.status}, comments="${chairman.comments}"`);
        }
    }

    process.exit(0);
})();
