
import { SubjectType } from './types';

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7]; // 7 columns: 4 periods, 1 lunch, 2 periods
export const LUNCH_PERIOD = 5;

export const PERIOD_TIMES = [
  '9.40am to 10.40am',
  '10.40am to 11.40am',
  '11.40am to 12.40pm',
  '12.40pm to 1.40pm',
  '1:40pm to 2:10pm', // LUNCH
  '2:10pm to 3:10pm',
  '3:10pm to 4:10pm'
];

export const INITIAL_FACULTY = [
  { id: 'f1', name: 'MS. MIZNA', email: 'mizna@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 18 },
  { id: 'f2', name: 'MRS. Y. SIRISHA', email: 'sirisha@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 15 },
  { id: 'f3', name: 'DR. M. KRISHNA', email: 'krishna@matrusri.edu.in', designation: 'Professor', department: 'IT', weeklyLoad: 12 },
  { id: 'f4', name: 'MRS. M. SRIVIDYA', email: 'srividya@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 15 },
  { id: 'f5', name: 'MS. J. NAGALAXMI', email: 'nagalaxmi@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 14 },
  { id: 'f6', name: 'MRS. STVSAV. RAMYA', email: 'ramya@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 16 },
  { id: 'f7', name: 'MRS. S. NAGAJYOTHI', email: 'nagajyothi@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 14 },
  { id: 'f8', name: 'MRS. T. ARUNA JYOTHI', email: 'arunajyothi@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 12 },
  { id: 'f9', name: 'DR. J. SRINIVAS', email: 'srinivas@matrusri.edu.in', designation: 'Professor', department: 'IT', weeklyLoad: 10 },
  { id: 'f10', name: 'MRS. K. MOUNIKA', email: 'mounika@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 14 },
  { id: 'f11', name: 'MR. A. RAJESH', email: 'rajesh@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 12 },
  { id: 'f12', name: 'MS. T. VIJAYA LAXMI', email: 'vijayalaxmi@matrusri.edu.in', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 12 },
];

export const INITIAL_ROOMS = [
  { id: 'r1', name: 'N 305', type: SubjectType.THEORY, capacity: 60 },
  { id: 'r2', name: 'N 313', type: SubjectType.THEORY, capacity: 60 },
  { id: 'r3', name: 'N 314', type: SubjectType.THEORY, capacity: 60 },
  { id: 'r4', name: 'N 304', type: SubjectType.THEORY, capacity: 60 },
  { id: 'r5', name: 'IT LAB 1', type: SubjectType.LAB, capacity: 35 },
  { id: 'r6', name: 'IT LAB 2', type: SubjectType.LAB, capacity: 35 },
];

export const INITIAL_SECTIONS = [
  { id: 's1', year: 4, semester: 7, name: 'A', classTeacherId: 'f6', defaultRoomId: 'r1', wefDate: '22/09/2025' },
  { id: 's2', year: 3, semester: 5, name: 'B', classTeacherId: 'f7', defaultRoomId: 'r2', wefDate: '22/09/2025' },
  { id: 's3', year: 3, semester: 5, name: 'A', classTeacherId: 'f11', defaultRoomId: 'r1', wefDate: '22/09/2025' },
];

export const INITIAL_SUBJECTS = [
  { id: 'sub1', code: 'PC701IT', name: 'Internet of Things', abbreviation: 'IOT', type: SubjectType.THEORY, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f1' },
  { id: 'sub2', code: 'PC702IT', name: 'Big Data Analytics', abbreviation: 'BDA', type: SubjectType.THEORY, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f2' },
  { id: 'sub3', code: 'OE704ME', name: 'Entrepreneurship', abbreviation: 'ENT', type: SubjectType.THEORY, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f3' },
  { id: 'sub4', code: 'PE 734 IT', name: 'Natural Language Processing', abbreviation: 'NLP', type: SubjectType.THEORY, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f4' },
  { id: 'sub5', code: 'PE 741 IT', name: 'Software Project Management', abbreviation: 'SPM', type: SubjectType.THEORY, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f5' },
  { id: 'sub6', code: 'PC751IT', name: 'Internet of Things Lab', abbreviation: 'IOT LAB', type: SubjectType.LAB, year: 4, semester: 7, section: 'A', periodsPerWeek: 3, assignedFacultyId: 'f1' },
];
