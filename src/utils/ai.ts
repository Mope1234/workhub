// Advanced AI Engine for social media, workflow suggestions, and content
import type { Workspace } from './types';
import * as store from './store';

// ═══════════════════════════════════════════
// CONTENT CALENDAR — What to post each day
// ═══════════════════════════════════════════
const MSG_CALENDAR: Record<string, { theme: string; emoji: string }> = {
  '0': { theme: 'impact', emoji: '💜' },    // Sunday — Impact stories
  '1': { theme: 'scholar', emoji: '🎓' },   // Monday — Scholar spotlight
  '2': { theme: 'donation', emoji: '💛' },   // Tuesday — Giving Tuesday
  '3': { theme: 'education', emoji: '📚' },  // Wednesday — Education facts
  '4': { theme: 'mentorship', emoji: '🤝' }, // Thursday — Mentorship
  '5': { theme: 'gratitude', emoji: '🙏' },  // Friday — Thank donors
  '6': { theme: 'community', emoji: '🌍' },  // Saturday — Community
};

const ZWC_CALENDAR: Record<string, { theme: string; emoji: string }> = {
  '0': { theme: 'selfcare', emoji: '🌿' },     // Sunday — Self-care
  '1': { theme: 'motivation', emoji: '💪' },    // Monday — Motivation
  '2': { theme: 'awareness', emoji: '🧠' },     // Tuesday — Awareness
  '3': { theme: 'tips', emoji: '💡' },           // Wednesday — Tips
  '4': { theme: 'stigma', emoji: '💙' },         // Thursday — Break stigma
  '5': { theme: 'lagos', emoji: '🏙️' },         // Friday — Lagos life
  '6': { theme: 'relationships', emoji: '❤️' },  // Saturday — Relationships
};

// ═══════════════════════════════════════════
// AI POST GENERATOR — Massive template library
// ═══════════════════════════════════════════

export function getTodayTheme(ws: Workspace): { theme: string; emoji: string; label: string } {
  const day = String(new Date().getDay());
  const cal = ws === 'msg' ? MSG_CALENDAR : ZWC_CALENDAR;
  const entry = cal[day];
  const labels: Record<string, string> = {
    impact: 'Impact Story Sunday', scholar: 'Scholar Monday', donation: 'Giving Tuesday',
    education: 'Education Wednesday', mentorship: 'Mentorship Thursday', gratitude: 'Gratitude Friday',
    community: 'Community Saturday', selfcare: 'Self-Care Sunday', motivation: 'Motivation Monday',
    awareness: 'Awareness Tuesday', tips: 'Wellness Tips Wednesday', stigma: 'Break the Stigma Thursday',
    lagos: 'Lagos Life Friday', relationships: 'Relationship Saturday',
  };
  return { ...entry, label: labels[entry.theme] || entry.theme };
}

export function getPostThemes(ws: Workspace): { key: string; label: string; emoji: string }[] {
  if (ws === 'msg') return [
    { key: 'impact', label: 'Impact Story', emoji: '💜' },
    { key: 'donation', label: 'Donation CTA', emoji: '💰' },
    { key: 'scholar', label: 'Scholar Spotlight', emoji: '🎓' },
    { key: 'mentorship', label: 'Mentorship', emoji: '🤝' },
    { key: 'education', label: 'Education Facts', emoji: '📚' },
    { key: 'gratitude', label: 'Thank Donors', emoji: '🙏' },
    { key: 'community', label: 'Community Impact', emoji: '🌍' },
    { key: 'tuesday', label: 'Giving Tuesday', emoji: '💛' },
    { key: 'exam', label: 'Scholarship Exam', emoji: '📝' },
    { key: 'transformation', label: 'Transformation Story', emoji: '✨' },
  ];
  return [
    { key: 'awareness', label: 'Mental Health Awareness', emoji: '🧠' },
    { key: 'lagos', label: 'Lagos Life', emoji: '🏙️' },
    { key: 'men', label: "Men's Mental Health", emoji: '💙' },
    { key: 'selfcare', label: 'Self-Care Tips', emoji: '🌿' },
    { key: 'anxiety', label: 'Anxiety & Stress', emoji: '😰' },
    { key: 'therapy', label: 'Why Therapy Works', emoji: '🛋️' },
    { key: 'workplace', label: 'Workplace Wellness', emoji: '💼' },
    { key: 'relationships', label: 'Relationships & MH', emoji: '❤️' },
    { key: 'sleep', label: 'Sleep & Mental Health', emoji: '😴' },
    { key: 'motivation', label: 'Monday Motivation', emoji: '💪' },
  ];
}

export function generatePost(ws: Workspace, theme: string): string {
  const s = store.getSettings();
  const posts: Record<string, string[]> = ws === 'msg' ? {
    impact: [
      `WHY WE DO WHAT WE DO 💜\n\nAt MSG Foundation, we have learned that many brilliant children are not lacking intelligence, discipline, or ambition — they are simply lacking opportunity.\n\nEvery time we meet a student who excels despite difficult circumstances, we are reminded why this mission matters.\n\nYour support helps reduce the burden on families struggling to keep their children in school.\n\nEducation is more than learning — it is a pathway to transformation. 🌟\n\n#MSGFoundation #EducationChangesLives`,
      `BEHIND EVERY SCHOLARSHIP IS A STORY 📖\n\nA child who almost dropped out.\nA family that couldn't afford school fees.\nA young person who dared to dream bigger than their circumstances.\n\nAt MSG Foundation, we don't just fund education — we fund futures.\n\nEvery scholarship we award is a vote of confidence in a young person's potential.\n\nBe part of someone's story today. 💛\n\n🏦 ${s.bankAccountName}\n🏛️ ${s.bankName}\n💳 ${s.bankAccount}\n\n#MSGFoundation #EducationChangesLives #ScholarshipSupport`,
      `IMPACT UPDATE 🌟\n\nThis month at MSG Foundation:\n\n✅ Scholars actively pursuing their education\n✅ Mentorship sessions connecting students with professional mentors\n✅ School fees paid, dreams kept alive\n✅ Futures being built, one student at a time\n\nNone of this would be possible without your support.\n\nThank you for believing in education. Thank you for believing in these young people.\n\n#MSGFoundation #ImpactThatMatters #EducationForAll`,
    ],
    donation: [
      `Because of you, dreams are still alive. 🌟\n\nEvery child we support, every school fee paid, every mentorship session held is a step toward a brighter future.\n\nThis week, choose impact.\nSupport a child's education today:\n\n🏦 ${s.bankAccountName}\n🏛️ ${s.bankName}\n💳 ${s.bankAccount}\n\nTogether, we can keep changing lives. 💛\n\n#MSGFoundation #SupportAChild #GiveBack`,
      `₦10,000 can change a child's life.\n\nThat's the cost of a few meals out.\nBut for a child in Iperu, it could mean:\n📚 School supplies for a term\n📝 Exam registration fees\n🎒 A school uniform\n\nNo amount is too small. Every contribution matters.\n\n🏦 ${s.bankAccountName}\n🏛️ ${s.bankName}\n💳 ${s.bankAccount}\n\n#MSGFoundation #GiveBack #EducationForAll`,
    ],
    scholar: [
      `SCHOLAR SPOTLIGHT 🌟\n\nEvery scholar in the MSG Foundation programme has a unique story of resilience, determination, and hope.\n\nFrom secondary school students in Iperu to university scholars across Nigeria — each one is proof that opportunity can change everything.\n\nWe don't just see students. We see future doctors, engineers, teachers, and leaders.\n\nSupport their journey today.\n\n#MSGFoundation #ScholarshipSupport #FutureLeaders`,
    ],
    mentorship: [
      `MENTORSHIP MATTERS 🎓\n\nAt MSG Foundation, we don't just pay fees — we invest in futures.\n\nOur mentorship programme pairs each university scholar with a dedicated mentor who guides them through:\n\n📌 Academic challenges\n📌 Career planning\n📌 Personal growth\n📌 Leadership development\n\nBecause every young person deserves someone who believes in their potential. ✨\n\n#MSGFoundation #Mentorship #FutureLeaders`,
    ],
    education: [
      `DID YOU KNOW? 📚\n\nIn Nigeria, over 20 million children are out of school — the highest number in the world.\n\nBut here's what we also know:\n\n✅ Education reduces poverty by 50%\n✅ Each year of schooling increases earnings by 10%\n✅ Educated girls are 3x less likely to marry before 18\n\nEvery child we put in school today changes the statistics tomorrow.\n\nJoin us. Support education.\n\n🏦 ${s.bankAccountName}\n🏛️ ${s.bankName}\n💳 ${s.bankAccount}\n\n#MSGFoundation #EducationFacts #EducationForAll`,
    ],
    gratitude: [
      `THANK YOU 🙏\n\nTo every donor, trustee, mentor, and supporter of MSG Foundation —\n\nYour generosity is not just financial. It is emotional. It is transformational.\n\nBecause of you:\n💛 A child stayed in school this term\n💛 A family breathed a sigh of relief\n💛 A young person didn't give up on their dreams\n\nThank you for being the reason someone's story didn't end at "I can't afford it."\n\n#MSGFoundation #ThankYou #ImpactThatMatters`,
    ],
    community: [
      `IPERU, OGUN STATE 🌍\n\nThis is where our story begins.\n\nIn this community, brilliant children face barriers that have nothing to do with intelligence — and everything to do with opportunity.\n\nMSG Foundation exists to bridge that gap.\n\nFrom Iperu to the university, we walk with our scholars every step of the way.\n\n📚 Education | 🤝 Mentorship | 💛 Support\n\n#MSGFoundation #IperuOgunState #CommunityImpact`,
    ],
    tuesday: [
      `GIVING TUESDAY 💛\n\nEvery Tuesday is an opportunity to change a life.\n\nWith as little as the cost of your daily coffee, you can help keep a child in school.\n\nSupport MSG Foundation today:\n\n🏦 ${s.bankAccountName}\n🏛️ ${s.bankName}\n💳 ${s.bankAccount}\n\nNo amount is too small. Every naira counts. 🙏\n\n#MSGFoundation #GivingTuesday #EducationForAll`,
    ],
    exam: [
      `SCHOLARSHIP EXAMINATIONS 📝\n\nAt MSG Foundation, we identify the brightest and most resilient students through our scholarship assessment.\n\nOur exams don't just test knowledge — they reveal potential.\n\nRecently, one student scored an outstanding 92%! 🌟\n\nThese are the young people your support helps us find and fund.\n\n#MSGFoundation #ScholarshipExam #HiddenGems`,
    ],
    transformation: [
      `FROM STRUGGLE TO SCHOLARSHIP ✨\n\nMany of our scholars come from families where school fees were an impossible dream.\n\nToday, they're in classrooms. Learning. Growing. Becoming.\n\nThat's the power of one scholarship.\nThat's the power of one person choosing to give.\nThat could be you.\n\n🏦 ${s.bankAccountName}\n🏛️ ${s.bankName}\n💳 ${s.bankAccount}\n\n#MSGFoundation #TransformationTuesday #EducationChangesLives`,
    ],
  } : {
    awareness: [
      `Your mental health matters. Your voice matters.\n\nYou matter. 💙\n\nHere's a gentle reminder for today:\n\n✔️ It's okay to not be okay\n✔️ Asking for help is a sign of strength\n✔️ You deserve support and understanding\n✔️ Small steps count\n\nAt Zerenity Wellness, we believe in accessible, compassionate mental health care.\n\nReach out. We're here for you.\n\n💙 Zerenity Wellness Clinic\n🌐 zerenitywellness.org\n\n#ZerenityWellness #MentalHealthMatters`,
      `1 in 4 people will experience a mental health condition in their lifetime.\n\nThat means someone you know — a friend, a colleague, a family member — may be struggling right now.\n\nWhat you can do:\n\n🤍 Ask "How are you really doing?"\n🤍 Listen without judgment\n🤍 Encourage professional support\n🤍 Check in regularly\n\nSmall acts of care can save lives.\n\n💙 Zerenity Wellness Clinic\n\n#ZerenityWellness #MentalHealthAwareness #BreakTheStigma`,
    ],
    lagos: [
      `Living in Lagos teaches you strength in ways no one talks about.\n\nThe endless traffic. The pressure to keep going. The noise. The hustle. The silent expectation to always "be okay."\n\nSometimes, survival mode becomes so normal that we forget what peace even feels like.\n\nBut behind every smile is someone carrying something heavy — stress, anxiety, burnout, grief, uncertainty…\n\nThis is your reminder:\n\nRest is not laziness.\nAsking for help is not weakness.\nTaking care of your mental health is not a luxury — it is necessary.\n\n🤍 Zerenity Wellness Clinic\n\n#ZerenityWellness #MentalHealthNigeria #LagosLife`,
    ],
    men: [
      `Mental health matters for everyone — including men. 💙\n\nToo often, men are expected to "stay strong" and handle life's challenges in silence.\n\nBut true strength includes being honest about how you're feeling, seeking support when needed, and prioritizing your well-being.\n\n✔️ Check in with yourself\n✔️ Check in with the men in your life\n✔️ Reach out for support when needed\n✔️ Remember: asking for help is a sign of strength, not weakness\n\nAt Zerenity Wellness, we believe that every person deserves support, understanding, and access to quality mental health care.\n\n💙 Zerenity Wellness\n\n#ZerenityWellness #MentalHealthMatters #BreakTheStigma`,
    ],
    selfcare: [
      `Self-care is not selfish — it's survival. 🌿\n\nIn a world that constantly demands more from you, taking time to recharge isn't a luxury — it's essential.\n\n5 things you can do right now:\n\n1️⃣ Take 5 deep breaths\n2️⃣ Drink a full glass of water\n3️⃣ Step outside for 10 minutes\n4️⃣ Put your phone down for 30 minutes\n5️⃣ Tell someone how you really feel\n\nSmall acts of self-care lead to big changes. Start today.\n\n💚 Zerenity Wellness Clinic\n🌐 zerenitywellness.org\n\n#ZerenityWellness #SelfCare #WellnessJourney`,
    ],
    anxiety: [
      `Anxiety doesn't always look like panic attacks.\n\nSometimes it looks like:\n\n😰 Overthinking every decision\n😰 Constantly feeling "on edge"\n😰 Difficulty sleeping\n😰 Avoiding social situations\n😰 Physical symptoms — headaches, stomach issues\n😰 Irritability over small things\n\nIf this sounds familiar, you're not alone.\n\nAnxiety is treatable. Help is available.\n\nBook a session with us today.\n\n💙 Zerenity Wellness Clinic\n🌐 zerenitywellness.org\n\n#ZerenityWellness #Anxiety #MentalHealthMatters`,
    ],
    therapy: [
      `"I don't need therapy, I'm not crazy."\n\nLet's correct this. 🛋️\n\nTherapy is NOT for "crazy" people.\nTherapy is for:\n\n✅ People dealing with stress\n✅ People processing grief\n✅ People navigating relationships\n✅ People managing anxiety or depression\n✅ People who want to understand themselves better\n✅ People who want to grow\n\nTherapy is for HUMANS.\n\nAnd you deserve it.\n\n💙 Zerenity Wellness Clinic\n🌐 zerenitywellness.org\n\n#ZerenityWellness #TherapyWorks #NormalizeTherapy`,
    ],
    workplace: [
      `Your job shouldn't cost you your mental health. 💼\n\nSigns of workplace burnout:\n\n🔴 Dreading Monday (every week)\n🔴 Feeling exhausted even after rest\n🔴 Losing interest in work you once enjoyed\n🔴 Constant irritability\n🔴 Physical symptoms — headaches, insomnia\n\nBurnout is real. And it's treatable.\n\nDon't wait until you break down. Reach out.\n\n💙 Zerenity Wellness Clinic\n\n#ZerenityWellness #WorkplaceMentalHealth #Burnout`,
    ],
    relationships: [
      `Healthy relationships start with a healthy mind. ❤️\n\nIf you're constantly:\n\n💔 People-pleasing at your own expense\n💔 Avoiding difficult conversations\n💔 Feeling drained after interactions\n💔 Struggling with trust\n💔 Repeating toxic patterns\n\n...it might be time to explore these patterns with a professional.\n\nYou deserve relationships that feel safe.\n\n💙 Zerenity Wellness Clinic\n🌐 zerenitywellness.org\n\n#ZerenityWellness #HealthyRelationships #MentalHealth`,
    ],
    sleep: [
      `Can't sleep? Your mind might be trying to tell you something. 😴\n\nPoor sleep is often linked to:\n\n🌙 Anxiety and racing thoughts\n🌙 Depression\n🌙 Unprocessed stress\n🌙 Burnout\n\nSleep hygiene tips:\n✅ Same bedtime every night\n✅ No screens 1 hour before bed\n✅ Cool, dark room\n✅ Limit caffeine after 2pm\n✅ Talk to a professional if it persists\n\nYour sleep matters. Your health matters.\n\n💙 Zerenity Wellness\n\n#ZerenityWellness #SleepHealth #MentalHealthTips`,
    ],
    motivation: [
      `New week. New start. 💪\n\nThis week, give yourself permission to:\n\n✅ Move at your own pace\n✅ Say no without guilt\n✅ Rest when you need to\n✅ Ask for help\n✅ Celebrate small wins\n\nProgress isn't always loud. Sometimes the bravest thing you do this week is simply showing up.\n\nYou've got this. And we've got you. 🤍\n\n💙 Zerenity Wellness Clinic\n\n#ZerenityWellness #MondayMotivation #MentalHealth`,
    ],
  };

  const options = posts[theme] || posts[Object.keys(posts)[0]];
  // Pick a random one for variety
  return options[Math.floor(Math.random() * options.length)];
}

// ═══════════════════════════════════════════
// AI WORKFLOW SUGGESTIONS
// ═══════════════════════════════════════════

export function getWorkflowSuggestions(ws: Workspace): string[] {
  const tasks = store.getTasks(ws);
  const tips: string[] = [];
  const overdue = tasks.filter(t => t.status !== 'done' && store.isOverdue(t.dueDate));
  const today = tasks.filter(t => t.status !== 'done' && store.isToday(t.dueDate));
  const todayTheme = getTodayTheme(ws);

  if (overdue.length > 3) tips.push(`🔥 You have ${overdue.length} overdue tasks. Block 1 hour to clear the backlog.`);
  if (today.length > 5) tips.push(`📋 Heavy day with ${today.length} tasks due. Prioritise the urgent ones first.`);
  tips.push(`📱 Today's social media theme: ${todayTheme.emoji} ${todayTheme.label} — tap Social Media to generate a post`);

  if (ws === 'msg') {
    const students = store.students.get().filter(s => s.status === 'active');
    const noMentor = students.filter(s => s.level === 'university' && !s.mentorName);
    if (noMentor.length) tips.push(`⚠️ ${noMentor.length} university scholar(s) without mentors: ${noMentor.map(s => s.name).join(', ')}`);
    const unpaid = students.filter(s => s.feeStatus === 'unpaid');
    if (unpaid.length) tips.push(`💰 ${unpaid.length} scholars with unpaid fees — follow up this week`);
    if (new Date().getDay() === 5) tips.push(`📝 It's Friday! Generate your weekly report in Reports tab.`);
  } else {
    const patients = store.patientsStore.get().filter(p => p.status === 'active');
    const noAppt = patients.filter(p => !p.nextAppointment);
    if (noAppt.length) tips.push(`📅 ${noAppt.length} active patient(s) with no upcoming appointment scheduled`);
  }
  return tips;
}

// ═══════════════════════════════════════════
// GMAIL COMPOSE HELPERS
// ═══════════════════════════════════════════

export function gmailComposeUrl(to: string, subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getMsgEmailTemplates(): { label: string; to: string; subject: string; body: string }[] {
  const s = store.getSettings();
  const weekLabel = `${store.formatDate(store.weekStart())} – ${store.formatDate(store.weekEnd())}`;
  return [
    { label: '📝 Weekly Report to Chairman', to: '', subject: `Programs Department Weekly Report — ${weekLabel}`, body: '[Paste your generated weekly report here]' },
    { label: '🎓 Mentor — Monthly Topic', to: '', subject: `MSG Foundation Mentorship — This Month's Topic`, body: `Dear [Mentor Name],\n\nI hope this message meets you well.\n\nThis is a reminder for this month's mentorship session with your mentee.\n\nPlease kindly pick a convenient date and time for the session.\n\nThank you for your continued support.\n\nWarm regards,\n${s.programsManagerName}\nPrograms Manager, MSG Foundation` },
    { label: '🤝 Donor Thank You', to: '', subject: 'Thank You for Your Support — MSG Foundation', body: `Dear [Donor Name],\n\nOn behalf of MSG Foundation, I want to sincerely thank you for your generous support.\n\nYour contribution directly impacts the lives of underprivileged children in Iperu, Ogun State.\n\nFor further donations:\n${s.bankAccountName}\n${s.bankName}\n${s.bankAccount}\n\nWarm regards,\n${s.programsManagerName}\nPrograms Manager, MSG Foundation` },
    { label: '📋 Trustee Update', to: '', subject: 'MSG Foundation — Trustee Update', body: `Dear Trustee,\n\nPlease find below an update on MSG Foundation activities...\n\n[Add details]\n\nWarm regards,\n${s.programsManagerName}\nPrograms Manager, MSG Foundation` },
    { label: '🎓 Student Follow-up', to: '', subject: 'MSG Foundation — Academic Check-in', body: `Dear [Student Name],\n\nThis is a follow-up from MSG Foundation regarding your academic progress.\n\nPlease share:\n1. How are your studies going?\n2. Any challenges you're facing?\n3. Your most recent results\n\nWe're here to support you.\n\nWarm regards,\n${s.programsManagerName}\nMSG Foundation` },
  ];
}

export function getZwcEmailTemplates(): { label: string; to: string; subject: string; body: string }[] {
  const s = store.getSettings();
  return [
    { label: '📝 Weekly Report to Dr. Gbadebo', to: '', subject: `Zerenity Wellness — Weekly Operations Report`, body: '[Paste your generated weekly report here]' },
    { label: '📅 Appointment Confirmation', to: '', subject: 'Zerenity Wellness Clinic — Appointment Confirmation', body: `Dear [Patient Name],\n\nThis is to confirm your appointment at Zerenity Wellness Clinic on [Date].\n\nPlease arrive on time. If you need to reschedule, kindly let us know.\n\nWarm regards,\nZerenity Wellness Clinic\n${s.zerenityDoctor}` },
    { label: '💊 Prescription Follow-up', to: '', subject: 'Zerenity Wellness — Medication Check-in', body: `Dear [Patient Name],\n\nThis is Zerenity Wellness Clinic checking in on your current medication.\n\nHow are you feeling? Any side effects or concerns?\n\nPlease don't hesitate to reach out.\n\nWarm regards,\nZerenity Wellness Clinic` },
    { label: '🤝 Partnership Inquiry', to: '', subject: 'Partnership Inquiry — Zerenity Wellness Clinic', body: `Dear [Name],\n\nI'm writing from Zerenity Wellness Clinic, a mental health practice led by ${s.zerenityDoctor}.\n\nWe would love to explore collaboration opportunities...\n\n[Add details]\n\nWarm regards,\n${s.programsManagerName}\nClinic Manager, Zerenity Wellness Clinic\n${s.zerenityWebsite}` },
  ];
}
