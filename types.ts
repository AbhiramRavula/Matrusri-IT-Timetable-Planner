
export enum UserRole {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT'
}

export enum SubjectType {
  THEORY = 'Theory',
  LAB = 'Lab'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  facultyId?: string;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  weeklyLoad: number; // in periods
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  type: SubjectType;
  semester: number;
  year: number;
  section: string;
  periodsPerWeek: number;
  assignedFacultyId: string;
}

export interface Room {
  id: string;
  name: string;
  type: SubjectType;
  capacity: number;
}

export interface Section {
  id: string;
  year: number;
  semester: number;
  name: string; // 'A' or 'B'
  classTeacherId?: string;
  defaultRoomId?: string;
  wefDate?: string;
}

export interface StudentGroup {
  id: string;
  sectionId: string;
  year: number;
  semester: number;
  strength: number;
  rollRange: string; // e.g., "2451-23-737-001 to 060"
}

export interface TimetableEntry {
  id: string;
  day: string;
  period: number;
  subjectId: string;
  facultyId: string;
  roomId: string;
  sectionId: string;
  batch?: string; // New field for lab batching: 'B1', 'B2', 'B3' or undefined for whole class
}

export interface ChangeLog {
  id: string;
  timestamp: string;
  user: string;
  description: string;
  reason?: string;
}

export interface AppState {
  users: User[];
  faculty: Faculty[];
  subjects: Subject[];
  rooms: Room[];
  sections: Section[];
  students: StudentGroup[];
  timetable: TimetableEntry[];
  logs: ChangeLog[];
  isPublished: boolean;
}
