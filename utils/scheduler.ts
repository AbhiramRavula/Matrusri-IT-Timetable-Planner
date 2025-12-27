
import { TimetableEntry, Subject, Room, Faculty, Section, SubjectType } from '../types';
import { DAYS, PERIODS, LUNCH_PERIOD } from '../constants';

export const generateTimetable = (
  subjects: Subject[],
  rooms: Room[],
  faculty: Faculty[],
  sections: Section[]
): TimetableEntry[] => {
  const result: TimetableEntry[] = [];
  
  // Track availability
  const facultyBusy = new Set<string>(); // "facultyId-day-period"
  const roomBusy = new Set<string>();    // "roomId-day-period"
  const sectionBusy = new Set<string>(); // "sectionId-day-period"

  // Track faculty current load
  const facultyLoad = new Map<string, number>();
  faculty.forEach(f => facultyLoad.set(f.id, 0));

  // Helper to mark busy
  const markBusy = (fId: string, rId: string, sId: string, day: string, period: number) => {
    facultyBusy.add(`${fId}-${day}-${period}`);
    roomBusy.add(`${rId}-${day}-${period}`);
    sectionBusy.add(`${sId}-${day}-${period}`);
    facultyLoad.set(fId, (facultyLoad.get(fId) || 0) + 1);
  };

  // Helper to check if available
  const isAvailable = (fId: string, rId: string, sId: string, day: string, period: number) => {
    if (period === LUNCH_PERIOD) return false;
    
    const fac = faculty.find(f => f.id === fId);
    const currentLoad = facultyLoad.get(fId) || 0;
    const hasCapacity = fac ? (currentLoad < fac.weeklyLoad) : true;

    return hasCapacity &&
           !facultyBusy.has(`${fId}-${day}-${period}`) &&
           !roomBusy.has(`${rId}-${day}-${period}`) &&
           !sectionBusy.has(`${sId}-${day}-${period}`);
  };

  // Sort subjects: Labs first (harder to place), then by periods required
  // Placing Labs first is a common heuristic for bin packing problems
  const sortedSubjects = [...subjects].sort((a, b) => {
    if (a.type === SubjectType.LAB && b.type !== SubjectType.LAB) return -1;
    if (a.type !== SubjectType.LAB && b.type === SubjectType.LAB) return 1;
    return b.periodsPerWeek - a.periodsPerWeek;
  });

  // To distribute load more evenly across the week, we can shuffle or rotate days 
  // for each subject so they don't all cluster on Monday morning.
  const getShuffledDays = () => [...DAYS].sort(() => Math.random() - 0.5);

  for (const subject of sortedSubjects) {
    let periodsNeeded = subject.periodsPerWeek;
    const targetSection = sections.find(s => s.year === subject.year && s.name === subject.section);
    if (!targetSection) continue;

    const suitableRooms = rooms.filter(r => r.type === subject.type);
    const daysToTry = getShuffledDays();
    
    for (const day of daysToTry) {
      if (periodsNeeded <= 0) break;

      for (const period of PERIODS) {
        if (periodsNeeded <= 0) break;
        if (period === LUNCH_PERIOD) continue;

        for (const room of suitableRooms) {
          // LABS: Must be exactly 2 consecutive periods
          if (subject.type === SubjectType.LAB && periodsNeeded >= 2) {
            const p1 = period;
            const p2 = period + 1;
            
            // Check if p2 exists, is not lunch, and both are available
            if (
              p2 <= PERIODS[PERIODS.length - 1] && 
              p2 !== LUNCH_PERIOD &&
              isAvailable(subject.assignedFacultyId, room.id, targetSection.id, day, p1) &&
              isAvailable(subject.assignedFacultyId, room.id, targetSection.id, day, p2)
            ) {
              // Check if faculty has capacity for 2 more periods
              const fac = faculty.find(f => f.id === subject.assignedFacultyId);
              const currentLoad = facultyLoad.get(subject.assignedFacultyId) || 0;
              if (fac && currentLoad + 2 <= fac.weeklyLoad) {
                [p1, p2].forEach(p => {
                  result.push({
                    id: Math.random().toString(36).substr(2, 9),
                    day,
                    period: p,
                    subjectId: subject.id,
                    facultyId: subject.assignedFacultyId,
                    roomId: room.id,
                    sectionId: targetSection.id
                  });
                  markBusy(subject.assignedFacultyId, room.id, targetSection.id, day, p);
                });
                periodsNeeded -= 2;
                break; // Move to next day/session for this subject to prevent triple labs
              }
            }
          } 
          // THEORY: Single period allocation
          else if (subject.type === SubjectType.THEORY) {
            if (isAvailable(subject.assignedFacultyId, room.id, targetSection.id, day, period)) {
              result.push({
                id: Math.random().toString(36).substr(2, 9),
                day,
                period,
                subjectId: subject.id,
                facultyId: subject.assignedFacultyId,
                roomId: room.id,
                sectionId: targetSection.id
              });
              markBusy(subject.assignedFacultyId, room.id, targetSection.id, day, period);
              periodsNeeded -= 1;
              break; // go to next day for this subject (pedagogical distribution)
            }
          }
        }
      }
    }
  }

  return result;
};
