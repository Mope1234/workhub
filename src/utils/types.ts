export type Workspace = 'msg' | 'zerenity';

export interface Student {
  id: string; name: string; level: 'secondary' | 'university' | 'awaiting';
  school: string; classYear: string; mentorName: string; mentorPhone: string;
  mentorEmail: string; feeStatus: 'paid' | 'partial' | 'unpaid' | 'na';
  totalFee: number; feePaid: number; phone: string; guardianName: string;
  guardianPhone: string; lastResult: string; lastFollowUp: string;
  nextFollowUp: string; notes: string;
  status: 'active' | 'graduated' | 'suspended' | 'awaiting';
  createdAt: string; updatedAt: string;
}

export interface MentorshipSession {
  id: string; month: string; studentId: string; mentorName: string;
  scheduledDate: string;
  status: 'pending' | 'scheduled' | 'reminder-sent' | 'completed' | 'missed';
  notes: string; createdAt: string;
}

export interface SecondaryGroupSession {
  id: string; month: string; date: string; topic: string;
  attendees: string[]; notes: string;
  status: 'planned' | 'completed' | 'cancelled'; createdAt: string;
}

export interface Donor {
  id: string; name: string; type: 'donor' | 'trustee'; email: string;
  phone: string; totalDonated: number; lastDonation: string;
  lastContact: string; nextFollowUp: string; notes: string;
  status: 'active' | 'lapsed' | 'prospect'; createdAt: string;
}

export interface DailyLog {
  id: string; workspace: Workspace; date: string; title: string; details: string;
  category: string; includeInReport: boolean; createdAt: string;
}

export interface Expense {
  id: string; workspace: Workspace; date: string; description: string; amount: number;
  category: string; createdAt: string;
}

export interface Task {
  id: string; workspace: Workspace; title: string; description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'done'; category: string;
  dueDate: string; recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  completedAt?: string; createdAt: string;
}

export interface Patient {
  id: string; name: string; phone: string; email: string;
  diagnosis: string; nextAppointment: string; lastVisit: string;
  prescriptions: string; prescriptionFollowUp: string; notes: string;
  status: 'active' | 'discharged' | 'no-show'; createdAt: string;
}

export interface SocialPost {
  id: string; workspace: Workspace; content: string;
  platform: 'all' | 'instagram' | 'facebook' | 'twitter' | 'linkedin';
  status: 'draft' | 'scheduled' | 'posted'; scheduledDate: string;
  hashtags: string; notes: string; createdAt: string;
}

export interface AppSettings {
  calendlyLink: string; msgFacebook: string; msgWebsite: string;
  zerenityWebsite: string; zerenityInstagram: string;
  bankName: string; bankAccount: string; bankAccountName: string;
  programsManagerName: string; chairmanName: string;
  firebaseUrl: string; syncEnabled: boolean; lastSyncAt: string;
  zerenityDoctor: string; geminiApiKey: string; groqApiKey: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  calendlyLink: '', msgFacebook: 'https://www.facebook.com/msg.foundation/',
  msgWebsite: 'https://msgbadebo.org', zerenityWebsite: 'https://zerenitywellness.org',
  zerenityInstagram: '', bankName: 'Providus Bank', bankAccount: '1309432392',
  bankAccountName: 'Mary Sunlola Gbadebo Foundation', programsManagerName: 'Mopelola Kadiri',
  chairmanName: 'Dr. Gbadebo', firebaseUrl: '', syncEnabled: false, lastSyncAt: '',
  zerenityDoctor: 'Dr. Fowobi Gbadebo',
  geminiApiKey: '',
  groqApiKey: '',
};

export const MENTORSHIP_TOPICS: Record<string, { title: string; focus: string[] }> = {
  '07': { title: 'Leadership, Initiative & Service', focus: ['Leadership beyond titles','Taking initiative on campus','Responsibility and service','Influence and positive impact'] },
  '08': { title: 'Resilience, Growth Mindset & Skill Building', focus: ['Handling failure and setbacks','Learning from mistakes','Using breaks and holidays productively','Skill development and personal growth'] },
  '09': { title: 'Career Clarity & Future Planning', focus: ['Career interests and alignment','Academic relevance to career goals','Exploring opportunities (internships, volunteering, exposure)','Long-term planning'] },
  '10': { title: 'Employability & Professional Readiness', focus: ['CV basics and personal branding','Workplace ethics','Professional conduct and attitude','Preparing for life after university'] },
  '11': { title: 'Financial Awareness & Life Skills', focus: ['Financial responsibility as a student','Budgeting and prioritization','Lifestyle choices','Preparing for independence'] },
  '12': { title: 'Year-End Reflection & Transition Planning', focus: ['Reviewing growth and progress','Key lessons from the year','Preparing for the next academic or life phase','Vision setting for 2027'] },
};

export const MSG_CATEGORIES = ['Student Management','Fee Processing','Results Follow-up','Mentorship','Social Media','Fundraising','Donor Management','Trustee Communication','Weekly Report','Scholarship Exam','Staff Management','Accounts','Summer Programme','Portal','General'];
export const ZWC_CATEGORIES = ['EMR Management','Patient Management','Scheduling','Prescription Follow-up','Marketing','Patient Acquisition','Accounts','Admin','General'];
export const MSG_LOG_CATEGORIES = ['Scholar Update','Welfare','Programme','Meeting','System/Portal','Staff','Financial','Partnership','Event','Exam','Mentorship','General'];
export const ZWC_LOG_CATEGORIES = ['Patient Update','Appointment','Prescription','EMR','Marketing','Revenue','Admin','Staff','Event','General'];
export const MSG_HASHTAGS = ['#MSGFoundation','#EducationChangesLives','#ScholarshipSupport','#HopeForTheFuture','#ImpactThatMatters','#EducationForAll','#IperuOgunState','#SupportAChild','#GiveBack'];
export const ZWC_HASHTAGS = ['#ZerenityWellness','#MentalHealthMatters','#MentalHealthAwareness','#WellnessJourney','#TherapyWorks','#MentalHealthNigeria','#BreakTheStigma','#HealingIsPossible','#SelfCare'];
