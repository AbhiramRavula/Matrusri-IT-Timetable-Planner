
import { SubjectType, StudentGroup } from './types';

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7]; // 7 columns: 4 periods, 1 lunch, 2 periods
export const LUNCH_PERIOD = 5;

export const PERIOD_TIMES = [
  '9:40am - 10:40am',
  '10:40am - 11:40am',
  '11:40am - 12:40pm',
  '12:40pm - 1:40pm',
  '1:40pm - 2:10pm', // LUNCH
  '2:10pm - 3:10pm',
  '3:10pm - 4:10pm'
];

export const INITIAL_FACULTY = [
  { id: 'f1', name: 'MS. MIZNA', email: 'mizna@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f2', name: 'MRS. Y. SIRISHA', email: 'sirisha@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f3', name: 'DR. M. KRISHNA', email: 'krishna@matrusri.edu.in', designation: 'Professor', department: 'IT', weeklyLoad: 20 },
  { id: 'f4', name: 'MRS. M. SRIVIDYA', email: 'srividya@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f5', name: 'MS. J. NAGALAXMI', email: 'nagalaxmi@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f6', name: 'MRS. STVSAV. RAMYA', email: 'ramya@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f7', name: 'MRS. S. NAGAJYOTHI', email: 'nagajyothi@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f8', name: 'MRS. T. ARUNA JYOTHI', email: 'arunajyothi@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f9', name: 'DR. J. SRINIVAS', email: 'srinivas@matrusri.edu.in', designation: 'Professor', department: 'IT', weeklyLoad: 20 },
  { id: 'f10', name: 'MRS. K. MOUNIKA', email: 'mounika@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f11', name: 'MR. A. RAJESH', email: 'rajesh@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f12', name: 'MS. T. VIJAYA LAXMI', email: 'vijayalaxmi@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f13', name: 'MRS. K. SUNITHA', email: 'sunitha@matrusri.edu.in', designation: 'Asst. Professor', department: 'H&S', weeklyLoad: 24 },
  { id: 'f14', name: 'DR. PALLAVI KHARE', email: 'pallavi@matrusri.edu.in', designation: 'Assoc. Professor', department: 'ECE', weeklyLoad: 24 },
  { id: 'f15', name: 'DR. M. NARESH', email: 'naresh@matrusri.edu.in', designation: 'Asst. Professor', department: 'ECE', weeklyLoad: 24 },
  { id: 'f16', name: 'DR. K. DURGA PRASAD', email: 'durgaprasad@matrusri.edu.in', designation: 'Professor', department: 'IT', weeklyLoad: 20 },
  { id: 'f17', name: 'DR. CH. RAJINI PRASHANTH', email: 'rajini@matrusri.edu.in', designation: 'Asst. Professor', department: 'H&S', weeklyLoad: 24 },
  { id: 'f18', name: 'NEW FACULTY A', email: 'facA@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f19', name: 'NEW FACULTY B', email: 'facB@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f20', name: 'DR. K. KOTESWARA RAO', email: 'koteswara@matrusri.edu.in', designation: 'Professor', department: 'ECE', weeklyLoad: 20 },
  { id: 'f21', name: 'DR. N. SHRIRBALA', email: 'shrirbala@matrusri.edu.in', designation: 'Professor', department: 'ECE', weeklyLoad: 20 },
  { id: 'f22', name: 'MRS. S. SIRISHA', email: 'ssirisha@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 },
  { id: 'f23', name: 'LIBRARY FACULTY', email: 'lib@matrusri.edu.in', designation: 'Librarian', department: 'IT', weeklyLoad: 100 },
  { id: 'f24', name: 'PHYSICAL DIRECTOR', email: 'sports@matrusri.edu.in', designation: 'PD', department: 'H&S', weeklyLoad: 100 },
  { id: 'f25', name: 'PLACEMENT CELL', email: 'crt@matrusri.edu.in', designation: 'Trainer', department: 'Placement', weeklyLoad: 100 },
];

export const INITIAL_ROOMS = [
  { id: 'r1', name: 'N 305', type: SubjectType.THEORY, capacity: 60 },
  { id: 'r2', name: 'N 313', type: SubjectType.THEORY, capacity: 60 },
  { id: 'r3', name: 'N 314', type: SubjectType.THEORY, capacity: 60 },
  { id: 'r4', name: 'N 304', type: SubjectType.THEORY, capacity: 60 },
  { id: 'r5', name: 'IT LAB 1', type: SubjectType.LAB, capacity: 35 },
  { id: 'r6', name: 'IT LAB 2', type: SubjectType.LAB, capacity: 35 },
  { id: 'r7', name: 'IT LAB 3', type: SubjectType.LAB, capacity: 35 },
  { id: 'r8', name: 'LIBRARY', type: SubjectType.THEORY, capacity: 100 },
  { id: 'r9', name: 'GROUND', type: SubjectType.THEORY, capacity: 200 },
  { id: 'r10', name: 'BE LAB', type: SubjectType.LAB, capacity: 35 },
];

export const INITIAL_SECTIONS = [
  { id: 's1', year: 4, semester: 7, name: 'A', classTeacherId: 'f6', defaultRoomId: 'r1', wefDate: '02/09/2025' },
  { id: 's2', year: 3, semester: 5, name: 'A', classTeacherId: 'f11', defaultRoomId: 'r1', wefDate: '22/09/2025' },
  { id: 's3', year: 3, semester: 5, name: 'B', classTeacherId: 'f7', defaultRoomId: 'r2', wefDate: '22/09/2025' },
  { id: 's4', year: 2, semester: 3, name: 'A', classTeacherId: 'f12', defaultRoomId: 'r4', wefDate: '22/09/2025' },
  { id: 's5', year: 2, semester: 3, name: 'B', classTeacherId: 'f10', defaultRoomId: 'r3', wefDate: '22/09/2025' },
];

export const INITIAL_STUDENTS: StudentGroup[] = [
  { id: 'st1', sectionId: 's1', year: 4, semester: 7, strength: 64, rollRange: '2451-21-737-001 to 064' },
  { id: 'st2', sectionId: 's2', year: 3, semester: 5, strength: 62, rollRange: '2451-22-737-001 to 062' },
  { id: 'st3', sectionId: 's3', year: 3, semester: 5, strength: 63, rollRange: '2451-22-737-063 to 125' },
  { id: 'st4', sectionId: 's4', year: 2, semester: 3, strength: 60, rollRange: '2451-23-737-001 to 060' },
  { id: 'st5', sectionId: 's5', year: 2, semester: 3, strength: 61, rollRange: '2451-23-737-061 to 121' },
];

export const INITIAL_SUBJECTS = [
  // VII SEM - SEC A
  { id: 'v7sa_1', code: 'PC701IT', name: 'Internet of Things', abbreviation: 'IOT', type: SubjectType.THEORY, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f1' },
  { id: 'v7sa_2', code: 'PC702IT', name: 'Big Data Analytics', abbreviation: 'BDA', type: SubjectType.THEORY, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f2' },
  { id: 'v7sa_3', code: 'OE704ME', name: 'Entrepreneurship', abbreviation: 'ENT', type: SubjectType.THEORY, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f3' },
  { id: 'v7sa_4', code: 'PE734IT', name: 'Natural Language Processing', abbreviation: 'NLP', type: SubjectType.THEORY, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f4' },
  { id: 'v7sa_5', code: 'PE741IT', name: 'Software Project Management', abbreviation: 'SPM', type: SubjectType.THEORY, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f5' },
  { id: 'v7sa_6', code: 'PC751IT', name: 'Internet of Things Lab', abbreviation: 'IOT LAB', type: SubjectType.LAB, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f1' },
  { id: 'v7sa_7', code: 'PW752IT', name: 'Project Work-I', abbreviation: 'PW-I', type: SubjectType.LAB, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f7' },
  
  // V SEM - SEC A
  { id: 'v5sa_1', code: 'PC508IT', name: 'Principles of Programming Languages', abbreviation: 'PPL', type: SubjectType.THEORY, year: 3, semester: 5, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f9' },
  { id: 'v5sa_2', code: 'PC509IT', name: 'Artificial Intelligence', abbreviation: 'AI', type: SubjectType.THEORY, year: 3, semester: 5, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f4' },
  { id: 'v5sa_3', code: 'PC510IT', name: 'Operating Systems', abbreviation: 'OS', type: SubjectType.THEORY, year: 3, semester: 5, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f11' },
  { id: 'v5sa_7', code: 'PC556IT', name: 'AI Lab', abbreviation: 'AI LAB', type: SubjectType.LAB, year: 3, semester: 5, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f4' },
  { id: 'v5sa_8', code: 'PC557IT', name: 'OS Lab', abbreviation: 'OS LAB', type: SubjectType.LAB, year: 3, semester: 5, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f11' },
  { id: 'v5sa_9', code: 'PC558IT', name: 'FSD Lab', abbreviation: 'FSD LAB', type: SubjectType.LAB, year: 3, semester: 5, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f12' },

  // III SEM - SEC A
  { id: 'v3sa_1', code: 'HS301EG', name: 'Effective Technical Communication', abbreviation: 'ETCE', type: SubjectType.THEORY, year: 2, semester: 3, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f17' },
  { id: 'v3sa_5', code: 'PC302IT', name: 'Database Systems', abbreviation: 'DBS', type: SubjectType.THEORY, year: 2, semester: 3, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f2' },
  { id: 'v3sa_6', code: 'ES301IT', name: 'Python Programming', abbreviation: 'PP', type: SubjectType.THEORY, year: 2, semester: 3, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f12' },
  { id: 'v3sa_9', code: 'PC351IT', name: 'DBS Lab', abbreviation: 'DBS LAB', type: SubjectType.LAB, year: 2, semester: 3, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f2' },
  { id: 'v3sa_10', code: 'ES351IT', name: 'PP Lab', abbreviation: 'PP LAB', type: SubjectType.LAB, year: 2, semester: 3, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f12' },
  { id: 'v3sa_11', code: 'ES352EC', name: 'BE Lab', abbreviation: 'BE LAB', type: SubjectType.LAB, year: 2, semester: 3, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f20' },

  // Common Non-subjects
  { id: 'common_lib', code: 'LIB', name: 'Library', abbreviation: 'LIB', type: SubjectType.THEORY, year: 0, semester: 0, section: '', periodsPerWeek: 0, assignedFacultyId: 'f23' },
  { id: 'common_sports', code: 'SPORTS', name: 'Sports', abbreviation: 'SPORTS', type: SubjectType.THEORY, year: 0, semester: 0, section: '', periodsPerWeek: 0, assignedFacultyId: 'f24' },
];
