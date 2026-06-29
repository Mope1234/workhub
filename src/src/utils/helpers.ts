import type { Student, Patient, AppSettings, Workspace, DailyLog, Expense } from './types';
import * as store from './store';

export function waLink(phone: string, msg: string) {
  if (!phone || !phone.trim()) return '#';
  const clean = phone.trim().replace(/[^0-9+]/g, '');
  if (clean.length < 6) return '#';
  let num = clean;
  if (num.startsWith('+')) num = num.slice(1);
  if (num.startsWith('0')) num = '234' + num.slice(1);
  if (!num.startsWith('234') && num.length <= 11) num = '234' + num;
  return `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(msg)}`;
}

export function waCompose(msg: string) {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
}

export function gmailCompose(to: string, subject: string, body: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function mailtoLink(to: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function mentorNotifyMsg(mentorName: string, menteeName: string, topic: { title: string; focus: string[] }, calendlyLink: string) {
  let msg = `Dear ${mentorName},\n\nI hope this message meets you well.\n\nThis is a reminder for this month's mentorship session with your mentee, *${menteeName}*.\n\n`;
  msg += `📌 *Topic: ${topic.title}*\n\n*Discussion Focus:*\n`;
  topic.focus.forEach(f => { msg += `• ${f}\n`; });
  msg += `\nPlease kindly pick a convenient date and time for the session${calendlyLink ? ` using the link below:\n🔗 ${calendlyLink}` : '.'}\n`;
  msg += `\nOnce you've selected a date, I will notify ${menteeName} accordingly.\n\nThank you for your continued support.\n\nWarm regards,\n${store.getSettings().programsManagerName}\nPrograms Manager, MSG Foundation`;
  return msg;
}

export function menteeSessionMsg(menteeName: string, mentorName: string, date: string, topic: { title: string; focus: string[] }) {
  let msg = `Hello ${menteeName},\n\nYour mentorship session with *${mentorName}* has been scheduled.\n\n`;
  msg += `📅 *Date: ${store.formatDate(date)}*\n📌 *Topic: ${topic.title}*\n\n*Areas to prepare:*\n`;
  topic.focus.forEach(f => { msg += `• ${f}\n`; });
  msg += `\nPlease be punctual and come prepared.\n\nBest regards,\n${store.getSettings().programsManagerName}\nMSG Foundation`;
  return msg;
}

export function menteeReminderMsg(menteeName: string, mentorName: string, date: string) {
  return `Hi ${menteeName} 👋\n\nJust a friendly reminder that your mentorship session with *${mentorName}* is coming up on *${store.formatDate(date)}*.\n\nPlease ensure you're prepared and on time.\n\nBest,\n${store.getSettings().programsManagerName}\nMSG Foundation`;
}

export function studentFollowUpMsg(student: Student) {
  return `Hello ${student.name},\n\nThis is a follow-up from MSG Foundation. We'd like to check in on your academic progress and wellbeing.\n\nPlease share:\n1. How are your studies going?\n2. Any challenges you're facing?\n3. Your most recent results\n\nWe're here to support you.\n\nWarm regards,\n${store.getSettings().programsManagerName}\nMSG Foundation`;
}

export function patientReminderMsg(patient: Patient, date: string) {
  return `Hello ${patient.name},\n\nThis is a reminder of your upcoming appointment at *Zerenity Wellness Clinic* on *${store.formatDate(date)}*.\n\nPlease arrive on time. If you need to reschedule, kindly let us know.\n\nWarm regards,\nZerenity Wellness Clinic`;
}

export function patientRxFollowUp(patient: Patient) {
  return `Hello ${patient.name},\n\nThis is Zerenity Wellness Clinic checking in on your medication.\n\nHow are you feeling on your current prescription? Please let us know:\n1. Any side effects?\n2. Are you taking it as prescribed?\n3. Any concerns?\n\nYour wellbeing matters to us.\n\nWarm regards,\nZerenity Wellness Clinic`;
}

export function donorThankYouMsg(donor: { name: string }) {
  const s = store.getSettings();
  return `Dear ${donor.name},\n\nOn behalf of MSG Foundation, I want to sincerely thank you for your generous support.\n\nYour contribution directly impacts the lives of underprivileged children in Iperu, Ogun State.\n\nFor further donations:\n🏦 ${s.bankAccountName}\n🏛️ ${s.bankName}\n💳 ${s.bankAccount}\n\nThank you for being part of this mission.\n\nWarm regards,\n${s.programsManagerName}\nPrograms Manager, MSG Foundation`;
}

// ═══════════════ AI REPORT GENERATION ═══════════════

export function generateWeeklyReport(ws: Workspace, settings: AppSettings): string {
  const wsStart = store.weekStart();
  const wsEnd = store.weekEnd();
  const allLogs = store.getLogs(ws).filter(l => l.date >= wsStart && l.date <= wsEnd && l.includeInReport);
  const allExpenses = store.getExpenses(ws).filter(e => e.date >= wsStart && e.date <= wsEnd);
  const tasks = store.getTasks(ws);
  const completedTasks = tasks.filter(t => t.status === 'done' && t.completedAt && t.completedAt.split('T')[0] >= wsStart);
  const pendingTasks = tasks.filter(t => t.status !== 'done').sort((a, b) => {
    const p: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
  });

  if (ws === 'msg') return generateMSGReport(settings, wsStart, wsEnd, allLogs, allExpenses, completedTasks, pendingTasks);
  return generateZWCReport(settings, wsStart, wsEnd, allLogs, allExpenses, completedTasks, pendingTasks);
}

function generateMSGReport(settings: AppSettings, wsStart: string, wsEnd: string, logs: DailyLog[], expenses: Expense[], completed: unknown[], pending: unknown[]): string {
  const allStudents = store.students.get().filter(s => s.status === 'active');
  const uniStudents = allStudents.filter(s => s.level === 'university');
  const secStudents = allStudents.filter(s => s.level === 'secondary');
  const completedTyped = completed as { title: string; category: string }[];
  const pendingTyped = pending as { title: string; dueDate: string; priority: string }[];

  let r = `Dear Sir,\n\nPlease find below the Programs Department's weekly report for the period ${store.formatDate(wsStart)} – ${store.formatDate(wsEnd)}.\n\n`;

  // Executive Summary - AI generated from activities
  r += `EXECUTIVE SUMMARY\n`;
  if (logs.length > 0 || completedTyped.length > 0) {
    const highlights: string[] = [];
    if (completedTyped.length > 0) highlights.push(`${completedTyped.length} task(s) were completed this week`);
    if (logs.length > 0) highlights.push(`${logs.length} key activity/activities documented`);
    const cats = [...new Set(logs.map(l => l.category))];
    if (cats.length > 0) highlights.push(`Key areas: ${cats.join(', ')}`);
    r += highlights.join('. ') + '.\n\n';
  } else {
    r += `[Add daily log entries throughout the week for an auto-generated summary]\n\n`;
  }

  // Log entries grouped by category
  const cats = [...new Set(logs.map(l => l.category))];
  cats.forEach(cat => {
    const items = logs.filter(l => l.category === cat);
    r += `${cat.toUpperCase()}\n`;
    items.forEach(item => {
      r += `▸ ${item.title}\n`;
      if (item.details) item.details.split('\n').forEach(line => { if (line.trim()) r += `  ${line.trim()}\n`; });
    });
    r += `\n`;
  });

  // Scholar overview
  r += `SCHOLARS OVERVIEW\n${'─'.repeat(30)}\n`;
  r += `• Total active scholars: ${allStudents.length}\n`;
  r += `• University scholars: ${uniStudents.length}\n`;
  r += `• Secondary scholars: ${secStudents.length}\n`;
  r += `• Awaiting admission: ${store.students.get().filter(s => s.status === 'awaiting').length}\n`;
  r += `• Fees paid: ${allStudents.filter(s => s.feeStatus === 'paid').length} | Partial: ${allStudents.filter(s => s.feeStatus === 'partial').length} | Unpaid: ${allStudents.filter(s => s.feeStatus === 'unpaid').length}\n\n`;

  // Expenses
  r += `WEEKLY EXPENSE REPORT 💰\n${'─'.repeat(30)}\n`;
  if (expenses.length === 0) r += `No expenses recorded this week.\n\n`;
  else {
    r += `S/N | Description | Amount\n`;
    expenses.forEach((e, i) => { r += `${i + 1}   | ${e.description} | ₦${e.amount.toLocaleString()}\n`; });
    r += `\nTotal: ₦${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}\n\n`;
  }

  // Pending
  r += `PENDING ACTIONS & NEXT STEPS\n${'─'.repeat(30)}\n`;
  if (pendingTyped.length === 0) r += `No pending tasks.\n\n`;
  else {
    pendingTyped.slice(0, 10).forEach(t => { r += `• ${t.title}${t.dueDate ? ` — Due: ${store.formatDate(t.dueDate)}` : ''}\n`; });
    if (pendingTyped.length > 10) r += `  ...and ${pendingTyped.length - 10} more\n`;
    r += `\n`;
  }

  r += `CLOSING REMARKS\n${'─'.repeat(30)}\nThank you for your continued guidance and support.\n\nWarm regards,\n${settings.programsManagerName}\nPrograms Manager\nMSG Foundation`;
  return r;
}

function generateZWCReport(settings: AppSettings, wsStart: string, wsEnd: string, logs: DailyLog[], expenses: Expense[], completed: unknown[], pending: unknown[]): string {
  const pts = store.patientsStore.get();
  const active = pts.filter(p => p.status === 'active');
  const completedTyped = completed as { title: string; category: string }[];
  const pendingTyped = pending as { title: string; dueDate: string; priority: string }[];

  let r = `ZERENITY WELLNESS CLINIC\nWeekly Operations Report\nPeriod: ${store.formatDate(wsStart)} – ${store.formatDate(wsEnd)}\nPrepared by: ${settings.programsManagerName}\nLead Clinician: ${settings.zerenityDoctor}\n${'═'.repeat(50)}\n\n`;

  r += `EXECUTIVE SUMMARY\n`;
  if (logs.length > 0 || completedTyped.length > 0) {
    if (completedTyped.length > 0) r += `${completedTyped.length} task(s) completed. `;
    if (logs.length > 0) r += `${logs.length} activity/activities logged. `;
    r += `\n\n`;
  } else r += `[Add daily log entries for auto-generated summary]\n\n`;

  // Logs
  const cats = [...new Set(logs.map(l => l.category))];
  cats.forEach(cat => {
    const items = logs.filter(l => l.category === cat);
    r += `${cat.toUpperCase()}\n`;
    items.forEach(item => { r += `▸ ${item.title}\n`; if (item.details) r += `  ${item.details}\n`; });
    r += `\n`;
  });

  r += `CLINIC OVERVIEW\n${'─'.repeat(30)}\n`;
  r += `• Active patients: ${active.length}\n`;
  r += `• Total patients on record: ${pts.length}\n`;
  r += `• Discharged: ${pts.filter(p => p.status === 'discharged').length}\n\n`;

  if (expenses.length > 0) {
    r += `EXPENSES\n${'─'.repeat(30)}\n`;
    expenses.forEach((e, i) => { r += `${i + 1}. ${e.description} — ₦${e.amount.toLocaleString()}\n`; });
    r += `Total: ₦${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}\n\n`;
  }

  r += `PENDING ACTIONS\n${'─'.repeat(30)}\n`;
  if (pendingTyped.length === 0) r += `No pending tasks.\n`;
  else pendingTyped.slice(0, 8).forEach(t => { r += `• ${t.title}${t.dueDate ? ` — Due: ${store.formatDate(t.dueDate)}` : ''}\n`; });

  r += `\n${'═'.repeat(50)}\n${settings.programsManagerName}\nClinic Manager\nZerenity Wellness Clinic`;
  return r;
}

// ═══════════════ AI SOCIAL MEDIA ═══════════════

export function enhancePost(content: string, workspace: Workspace): string[] {
  const tips: string[] = [];
  const len = content.length;
  if (len < 50) tips.push('💡 Your post is quite short. Add context, a story, or emotion to boost engagement.');
  if (len > 280 && len < 300) tips.push('⚠️ Close to Twitter/X limit (280 chars). Consider trimming for that platform.');
  if (len > 2200) tips.push('⚠️ Exceeds Instagram caption limit (2,200 chars). Split or trim.');
  if (!content.includes('?')) tips.push('💡 Add a question to encourage comments and interaction.');
  if (!/[🎓💙🌟❤️✨🙏💪🧠💜🤍💚✔️😊🌱]/.test(content)) tips.push('💡 Add emojis to make it more visually engaging.');
  if (workspace === 'msg') {
    if (!/donate|support|give|contribut/i.test(content)) tips.push('💡 Add a donation CTA with bank details for fundraising posts.');
    if (!/msg foundation/i.test(content)) tips.push('💡 Mention "MSG Foundation" for brand recognition.');
    if (!/education|scholar|school|learn/i.test(content)) tips.push('💡 Include education-related keywords for SEO and reach.');
  } else {
    if (!/zerenity/i.test(content)) tips.push('💡 Mention "Zerenity Wellness" for brand recognition.');
    if (!/book|reach|contact|visit|call|dm/i.test(content)) tips.push('💡 Add a CTA like "Book a session" or "DM us".');
    if (!/mental health|wellness|therap|heal/i.test(content)) tips.push('💡 Include mental health keywords for reach.');
  }
  if (content.split('\n\n').length < 3 && len > 200) tips.push('💡 Break into more paragraphs for readability on mobile.');
  if (!tips.length) tips.push('✅ Your post looks great! Consider adding relevant hashtags below.');
  return tips;
}

export function aiGeneratePost(workspace: Workspace, theme: string): string {
  const s = store.getSettings();
  const msgPosts: Record<string, string> = {
    'impact': `WHY WE DO WHAT WE DO 💜\n\nAt MSG Foundation, we have learned that many brilliant children are not lacking intelligence, discipline, or ambition — they are simply lacking opportunity.\n\nEvery time we meet a student who excels despite difficult circumstances, we are reminded why this mission matters.\n\nYour support helps reduce the burden on families struggling to keep their children in school. It gives hope where life has been difficult.\n\nEducation is more than learning — it is a pathway to transformation. 🌟\n\n#MSGFoundation #EducationChangesLives #ScholarshipSupport`,
    'donation': `Because of you, dreams are still alive. 🌟\n\nEvery child we support, every school fee paid, every mentorship session held is a step toward a brighter future.\n\nThis week, choose impact.\nSupport a child's education today:\n\n🏦 ${s.bankAccountName}\n🏛️ ${s.bankName}\n💳 ${s.bankAccount}\n\nTogether, we can keep changing lives. 💛\n\n#MSGFoundation #SupportAChild #GiveBack`,
    'mentorship': `MENTORSHIP MATTERS 🎓\n\nAt MSG Foundation, we don't just pay fees — we invest in futures.\n\nOur mentorship programme pairs each university scholar with a dedicated mentor who guides them through academic challenges, career planning, and personal growth.\n\nBecause every young person deserves someone who believes in their potential. ✨\n\nWant to be a mentor or support our programme?\nReach out to us today.\n\n#MSGFoundation #Mentorship #FutureLeaders`,
    'tuesday': `GIVING TUESDAY 💛\n\nEvery Tuesday is an opportunity to change a life.\n\nWith as little as the cost of your daily coffee, you can help keep a child in school.\n\nSupport MSG Foundation today:\n\n🏦 ${s.bankAccountName}\n🏛️ ${s.bankName}\n💳 ${s.bankAccount}\n\nNo amount is too small. Every naira counts. 🙏\n\n#MSGFoundation #GivingTuesday #EducationForAll`,
  };
  const zwcPosts: Record<string, string> = {
    'awareness': `Your mental health matters. Your voice matters.\n\nYou matter. 💙\n\nHere's a gentle reminder for today:\n\n✔️ It's okay to not be okay\n✔️ Asking for help is a sign of strength\n✔️ You deserve support and understanding\n✔️ Small steps count\n\nAt Zerenity Wellness, we believe in accessible, compassionate mental health care.\n\nReach out. We're here for you.\n\n💙 Zerenity Wellness Clinic\nwww.zerenitywellness.org\n\n#ZerenityWellness #MentalHealthMatters`,
    'lagos': `Living in Lagos teaches you strength in ways no one talks about.\n\nThe endless traffic. The pressure to keep going. The noise. The hustle. The silent expectation to always "be okay."\n\nSometimes, survival mode becomes so normal that we forget what peace even feels like.\n\nBut behind every smile is someone carrying something heavy — stress, anxiety, burnout, grief, uncertainty…\n\nThis is your reminder:\n\nRest is not laziness.\nAsking for help is not weakness.\nTaking care of your mental health is not a luxury — it is necessary.\n\nIn the middle of the chaos, may you find moments of softness, healing, and peace. 🤍\n\n— Zerenity Wellness Clinic\n\n#ZerenityWellness #MentalHealthNigeria #BreakTheStigma`,
    'men': `Mental health matters for everyone — including men. 💙\n\nToo often, men are expected to "stay strong" and handle life's challenges in silence.\n\nBut true strength includes being honest about how you're feeling, seeking support when needed, and prioritizing your well-being.\n\n✔️ Check in with yourself\n✔️ Check in with the men in your life\n✔️ Reach out for support when needed\n✔️ Remember: asking for help is a sign of strength, not weakness\n\nAt Zerenity Wellness, we believe that every person deserves support, understanding, and access to quality mental health care.\n\nYour mental health matters. Your voice matters.\n\n💙 Zerenity Wellness\n\n#ZerenityWellness #MentalHealthMatters #BreakTheStigma`,
    'selfcare': `Self-care is not selfish — it's survival. 🌿\n\nIn a world that constantly demands more from you, taking time to recharge isn't a luxury — it's essential.\n\nHere are 5 simple things you can do today:\n\n1️⃣ Take 5 deep breaths right now\n2️⃣ Drink a full glass of water\n3️⃣ Step outside for 10 minutes\n4️⃣ Put your phone down for 30 minutes\n5️⃣ Tell someone how you really feel\n\nSmall acts of self-care lead to big changes. Start today.\n\n💚 Zerenity Wellness Clinic\n\n#ZerenityWellness #SelfCare #WellnessJourney`,
  };
  const posts = workspace === 'msg' ? msgPosts : zwcPosts;
  return posts[theme] || posts[Object.keys(posts)[0]];
}
