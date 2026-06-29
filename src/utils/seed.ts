import type { Student, Task } from './types';
import { students, genId, getTasks, saveTasks } from './store';

const SEED_KEY = 'msg_seeded_v2';
const TASK_SEED_KEY = 'wh_tasks_seeded_v2';

export function seedStudentsIfNeeded() {
  if (localStorage.getItem(SEED_KEY)) {
    seedTasksIfNeeded();
    return false;
  }
  const existing = students.get();
  if (existing.length > 0) { localStorage.setItem(SEED_KEY, '1'); seedTasksIfNeeded(); return false; }

  const now = new Date().toISOString();
  const data: Student[] = [
    // University
    { id: genId(), name: 'Samod Atanda', level: 'university', school: '', classYear: '500 Level', mentorName: 'Dr. Deji Olajide', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Oluwadarasimi Taiwo', level: 'university', school: '', classYear: '400 Level', mentorName: 'Mrs. Gbadebo', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Samuel Oluwawamiri', level: 'university', school: '', classYear: '200 Level', mentorName: 'Prof. Peter Ekeh', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Ayomide Aina', level: 'university', school: '', classYear: '400 Level', mentorName: 'Ms. Adebola Gbadebo', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Oluwasegun Akinwale', level: 'university', school: '', classYear: '200 Level', mentorName: 'Dr. Folasade Kehinde', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Abatan Oluwabusola', level: 'university', school: '', classYear: '300 Level', mentorName: 'Dr. Foluke Otitoju', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Marvellous Onanubi', level: 'university', school: '', classYear: '400 Level', mentorName: 'Dr. Foluke Otitoju', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Abiodun Okunola', level: 'university', school: '', classYear: '200 Level', mentorName: 'Ms. Adebola Gbadebo', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Taiwo Testimony', level: 'university', school: '', classYear: '200 Level', mentorName: 'Dr. Folasade Kehinde', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Success Oloyede', level: 'university', school: '', classYear: '100 Level', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: 'Needs mentor assignment', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Taiwo Victor', level: 'university', school: '', classYear: '100 Level', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: 'Needs mentor assignment', status: 'active', createdAt: now, updatedAt: now },
    // Awaiting
    { id: genId(), name: 'Oluwafemi Oyindotun', level: 'awaiting', school: '', classYear: 'Awaiting Admission', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'awaiting', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Ayuba Godwin', level: 'awaiting', school: '', classYear: 'Awaiting Admission', mentorName: 'Mr. Dami Gbadebo', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'awaiting', createdAt: now, updatedAt: now },
    // Secondary
    { id: genId(), name: 'Samuel Bessy Ada', level: 'secondary', school: '', classYear: 'JSS 1', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Favor Moses Moyosore', level: 'secondary', school: '', classYear: 'JSS 1', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Bamidele Oreyomi', level: 'secondary', school: '', classYear: 'JSS 1', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Adunola Fadero', level: 'secondary', school: '', classYear: 'JSS 3', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Joseph Jethro', level: 'secondary', school: '', classYear: 'SS 1', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Ogundele Amirah', level: 'secondary', school: '', classYear: 'SS 1', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Agbeze Mercy', level: 'secondary', school: '', classYear: 'SS 1', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Adeyemi Mercy', level: 'secondary', school: '', classYear: 'JSS 3', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Temitayo Daniel', level: 'secondary', school: '', classYear: 'JSS 3', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Balogun Iysah', level: 'secondary', school: '', classYear: 'JSS 2', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Salaudeen Aduke', level: 'secondary', school: '', classYear: 'JSS 2', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'George Rejoice Grace', level: 'secondary', school: '', classYear: 'JSS 2', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
    { id: genId(), name: 'Ayodele Daniel', level: 'secondary', school: '', classYear: 'SS 3', mentorName: '', mentorPhone: '', mentorEmail: '', feeStatus: 'na', totalFee: 0, feePaid: 0, phone: '', guardianName: '', guardianPhone: '', lastResult: '', lastFollowUp: '', nextFollowUp: '', notes: '', status: 'active', createdAt: now, updatedAt: now },
  ];

  students.save(data);
  localStorage.setItem(SEED_KEY, '1');
  seedTasksIfNeeded();
  return true;
}

function seedTasksIfNeeded() {
  if (localStorage.getItem(TASK_SEED_KEY)) return;
  // Merge: keep existing tasks, add new ones that don't already exist (by title match)
  const existingMsg = getTasks('msg');
  const existingZwc = getTasks('zerenity');

  const now = new Date().toISOString();
  const t = (ws: 'msg' | 'zerenity', title: string, cat: string, priority: 'urgent' | 'high' | 'medium' | 'low', due: string, recurring: 'none' | 'daily' | 'weekly' | 'monthly', desc = ''): Task => ({
    id: genId(), workspace: ws, title, description: desc, priority, status: 'todo', category: cat, dueDate: due, recurring, createdAt: now,
  });

  // ════════════════════════════════════════
  // MSG FOUNDATION — YOUR PENDING ACTIONS
  // ════════════════════════════════════════
  const msgPending: Task[] = [
    t('msg', 'Complete upload of past student records to the Scholars Portal', 'Portal', 'urgent', '2026-07-04', 'none', 'Background upload of historical records for all scholars'),
    t('msg', 'Confirm hotel booking for Dr. Kehinde Dad burial trip', 'General', 'urgent', '2026-07-01', 'none', 'Hotel booking for Thursday night & Friday. Wake keeping July 2, Burial July 3'),
    t('msg', 'Finalise and collect signed Commitment Letter from Oreyomi Dad\'s family', 'Student Management', 'high', '2026-07-04', 'none', 'Formalise Foundation engagement and mutual expectations with Bamidele Oreyomi family'),
    t('msg', 'Identify and engage partner foundation for feeding/welfare support', 'Partnership', 'high', '2026-07-11', 'none', 'Scout for partner foundation for supplementary support in feeding and welfare for Oreyomi family'),
    t('msg', 'Prepare orientation materials for July 6 new intake meeting', 'Scholarship Exam', 'urgent', '2026-07-05', 'none', 'Meeting with student who scored highest (92%) in last scholarship exam'),
    t('msg', 'Conduct portal access checks for all issued scholar logins', 'Portal', 'high', '2026-07-04', 'none', 'Verify all scholars can log in and access their personalised portals'),
    t('msg', 'Submit revised 2-day Summer Programme plan', 'Summer Programme', 'high', '2026-07-07', 'none', 'Comprehensive revised plan with updated schedule, activities and logistics for the new 2-day format'),
  ];

  // ════════════════════════════════════════
  // MSG FOUNDATION — DAILY RECURRING
  // ════════════════════════════════════════
  const msgDaily: Task[] = [
    t('msg', 'Check and respond to all scholar inquiries and messages', 'Student Management', 'high', '2026-07-01', 'daily', 'WhatsApp, calls, portal messages from scholars'),
    t('msg', 'Review and respond to social media comments and DMs', 'Social Media', 'medium', '2026-07-01', 'daily', 'Facebook, Instagram engagement'),
    t('msg', 'Log daily activities and issues in the Daily Log', 'Weekly Report', 'medium', '2026-07-01', 'daily', 'Update daily log so weekly report auto-generates accurately'),
    t('msg', 'Check Scholars Portal for new submissions and requests', 'Portal', 'medium', '2026-07-01', 'daily', 'Review new results uploads, bill submissions, and scholar requests'),
  ];

  // ════════════════════════════════════════
  // MSG FOUNDATION — WEEKLY RECURRING
  // ════════════════════════════════════════
  const msgWeekly: Task[] = [
    t('msg', 'Prepare and submit weekly report to Dr. Gbadebo', 'Weekly Report', 'urgent', '2026-07-04', 'weekly', 'Due every Friday. Use Reports tab to auto-generate from daily log entries'),
    t('msg', 'Review and update student fee payment status', 'Fee Processing', 'high', '2026-07-04', 'weekly', 'Check which scholars have paid, partial, or outstanding fees'),
    t('msg', 'Post on MSG Foundation social media (minimum 2 posts)', 'Social Media', 'medium', '2026-07-04', 'weekly', 'Use Social Media tab for AI-generated posts — impact stories, donation CTAs, scholar spotlights'),
    t('msg', 'Follow up on outstanding student academic results', 'Results Follow-up', 'medium', '2026-07-04', 'weekly', 'Contact scholars who haven\'t submitted recent results'),
    t('msg', 'Review and reconcile weekly accounts and expenses', 'Accounts', 'high', '2026-07-04', 'weekly', 'Log all expenses in Reports → Expenses tab'),
    t('msg', 'Check mentorship session progress for university scholars', 'Mentorship', 'medium', '2026-07-04', 'weekly', 'Review Students → Mentorship tab for pending/scheduled sessions'),
    t('msg', 'Follow up with donors and trustees due for contact', 'Donor Management', 'medium', '2026-07-04', 'weekly', 'Check Donors page for follow-ups due'),
    t('msg', 'Review scholar welfare and follow-up on flagged students', 'Student Management', 'high', '2026-07-04', 'weekly', 'Check for students with overdue follow-ups or issues'),
  ];

  // ════════════════════════════════════════
  // MSG FOUNDATION — MONTHLY RECURRING
  // ════════════════════════════════════════
  const msgMonthly: Task[] = [
    t('msg', 'Send mentorship topic and Calendly link to all university mentors', 'Mentorship', 'high', '2026-07-01', 'monthly', 'Email/WhatsApp each mentor with this month\'s topic and ask to pick date. Use Students → Mentorship tab'),
    t('msg', 'Organise group mentorship session for secondary scholars at Iperu Office', 'Mentorship', 'high', '2026-07-15', 'monthly', 'Monthly group session for all secondary school scholars'),
    t('msg', 'Update and review all student records on the portal', 'Student Management', 'medium', '2026-07-28', 'monthly', 'Ensure all scholar profiles, results, and bills are up to date'),
    t('msg', 'Prepare monthly financial summary for Chairman', 'Accounts', 'high', '2026-07-28', 'monthly', 'Compile all income (donations) and expenses for the month'),
    t('msg', 'Review and update donor/trustee database', 'Donor Management', 'medium', '2026-07-28', 'monthly', 'Update contact info, donation records, schedule follow-ups'),
    t('msg', 'Plan social media content calendar for next month', 'Social Media', 'medium', '2026-07-25', 'monthly', 'Plan themes, posts, campaigns. Use Social Media tab for templates'),
    t('msg', 'Review scholarship exam pipeline and upcoming intakes', 'Scholarship Exam', 'medium', '2026-07-28', 'monthly', 'Track new applicants, exam schedules, results pending'),
    t('msg', 'Send follow-up/check-in message to ALL active scholars', 'Student Management', 'medium', '2026-07-15', 'monthly', 'Bulk check-in via WhatsApp on academics, welfare, challenges'),
    t('msg', 'Review staff tasks and coordination', 'Staff Management', 'low', '2026-07-28', 'monthly', 'Ensure all staff responsibilities are on track'),
    t('msg', 'Fundraising outreach — identify and contact potential new donors', 'Fundraising', 'medium', '2026-07-15', 'monthly', 'Prospecting, proposal writing, outreach emails'),
    t('msg', 'Review Trustee communication — send updates or meeting requests', 'Trustee Communication', 'medium', '2026-07-28', 'monthly', 'Keep trustees informed of foundation activities and impact'),
  ];

  // ════════════════════════════════════════
  // ZERENITY WELLNESS — DAILY RECURRING
  // ════════════════════════════════════════
  const zwcDaily: Task[] = [
    t('zerenity', 'Check and confirm patient appointments for today', 'Scheduling', 'urgent', '2026-07-01', 'daily', 'Review schedule, send reminders to patients via WhatsApp'),
    t('zerenity', 'Follow up on patient prescription compliance', 'Prescription Follow-up', 'high', '2026-07-01', 'daily', 'Check which patients are due for Rx follow-up and message them'),
    t('zerenity', 'Respond to patient inquiries (WhatsApp, calls, email)', 'Patient Management', 'high', '2026-07-01', 'daily', 'Respond promptly to all patient communications'),
    t('zerenity', 'Update EMR with patient notes and visit records', 'EMR Management', 'high', '2026-07-01', 'daily', 'Enter clinical notes from Dr. Fowobi Gbadebo after each session'),
    t('zerenity', 'Review and respond to clinic social media messages', 'Marketing', 'medium', '2026-07-01', 'daily', 'Instagram, Facebook DMs and comments'),
    t('zerenity', 'Log daily clinic activities in Daily Log', 'Admin', 'medium', '2026-07-01', 'daily', 'Record patient visits, issues, decisions for weekly report'),
  ];

  // ════════════════════════════════════════
  // ZERENITY WELLNESS — WEEKLY RECURRING
  // ════════════════════════════════════════
  const zwcWeekly: Task[] = [
    t('zerenity', 'Prepare and send weekly operations report to Dr. Fowobi Gbadebo', 'Admin', 'urgent', '2026-07-04', 'weekly', 'Use Reports tab to auto-generate. Send via WhatsApp or email'),
    t('zerenity', 'Review all upcoming patient appointments for the week', 'Scheduling', 'high', '2026-07-01', 'weekly', 'Confirm appointments, identify gaps, plan schedule'),
    t('zerenity', 'Post on Zerenity Wellness social media (minimum 2 posts)', 'Marketing', 'medium', '2026-07-04', 'weekly', 'Use Social Media tab for AI-generated posts — mental health tips, awareness, Lagos life'),
    t('zerenity', 'Review and reconcile clinic accounts', 'Accounts', 'high', '2026-07-04', 'weekly', 'Track revenue, expenses, outstanding payments'),
    t('zerenity', 'Follow up with no-show patients', 'Patient Management', 'high', '2026-07-04', 'weekly', 'Reach out to patients who missed appointments via WhatsApp'),
    t('zerenity', 'Marketing outreach for new patient acquisition', 'Patient Acquisition', 'medium', '2026-07-04', 'weekly', 'Online ads, referral follow-ups, community outreach'),
    t('zerenity', 'Check prescription refill schedules for all active patients', 'Prescription Follow-up', 'high', '2026-07-04', 'weekly', 'Ensure no patient runs out of medication'),
    t('zerenity', 'Coordinate with Dr. Fowobi Gbadebo on week\'s clinical notes', 'EMR Management', 'medium', '2026-07-04', 'weekly', 'Ensure all clinical notes from sessions are captured in EMR'),
  ];

  // ════════════════════════════════════════
  // ZERENITY WELLNESS — MONTHLY RECURRING
  // ════════════════════════════════════════
  const zwcMonthly: Task[] = [
    t('zerenity', 'Prepare monthly financial summary and revenue report', 'Accounts', 'high', '2026-07-28', 'monthly', 'Compile all clinic income and expenses for the month'),
    t('zerenity', 'Review patient retention and follow-up rates', 'Patient Management', 'medium', '2026-07-28', 'monthly', 'Analyse how many patients are returning, identify drop-offs'),
    t('zerenity', 'Plan social media content calendar for next month', 'Marketing', 'medium', '2026-07-25', 'monthly', 'Plan themes: mental health awareness days, tips series, testimonials'),
    t('zerenity', 'Review and update EMR system data', 'EMR Management', 'medium', '2026-07-28', 'monthly', 'Data cleanup, ensure all records are complete and accurate'),
    t('zerenity', 'Marketing campaign planning — new patient strategies', 'Patient Acquisition', 'medium', '2026-07-15', 'monthly', 'Plan campaigns, referral programmes, community partnerships'),
    t('zerenity', 'Review clinic supplies and administrative needs', 'Admin', 'low', '2026-07-28', 'monthly', 'Office supplies, forms, prescriptions pads, etc.'),
    t('zerenity', 'Clinic growth strategy meeting with Dr. Fowobi Gbadebo', 'Admin', 'high', '2026-07-28', 'monthly', 'Discuss patient numbers, marketing, service expansion, hiring plans'),
    t('zerenity', 'Review and update clinic website and online listings', 'Marketing', 'medium', '2026-07-28', 'monthly', 'Ensure zerenitywellness.org is up to date, Google listing accurate'),
  ];

  // Merge: keep existing tasks, only add new ones that don't exist by title
  const newMsg = [...msgPending, ...msgDaily, ...msgWeekly, ...msgMonthly];
  const existingMsgTitles = new Set(existingMsg.map(t => t.title));
  const mergedMsg = [...existingMsg, ...newMsg.filter(t => !existingMsgTitles.has(t.title))];
  saveTasks('msg', mergedMsg);

  const newZwc = [...zwcDaily, ...zwcWeekly, ...zwcMonthly];
  const existingZwcTitles = new Set(existingZwc.map(t => t.title));
  const mergedZwc = [...existingZwc, ...newZwc.filter(t => !existingZwcTitles.has(t.title))];
  saveTasks('zerenity', mergedZwc);

  localStorage.setItem(TASK_SEED_KEY, '1');
}
