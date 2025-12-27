
import { TimetableEntry, Subject, Room, Faculty, Section, SubjectType } from '../types';
import { DAYS, PERIODS, LUNCH_PERIOD } from '../constants';

export const generateTimetable = (
  subjects: Subject[],
  rooms: Room[],
  faculty: Faculty[],
  sections: Section[]
): TimetableEntry[] => {
  const result: TimetableEntry[] = [];
  
  // Tracking structures
  const facultyBusy = new Set<string>(); // "fId-day-period"
  const roomBusy = new Set<string>();    // "rId-day-period"
  const sectionBusy = new Set<string>(); // "sId-day-period-batch" (batch 'ALL' means entire section)
  const facultyLoad = new Map<string, number>();
  
  faculty.forEach(f => facultyLoad.set(f.id, 0));

  const markBusy = (fId: string, rId: string, sId: string, day: string, period: number, batch: string = 'ALL') => {
    facultyBusy.add(`${fId}-${day}-${period}`);
    roomBusy.add(`${rId}-${day}-${period}`);
    sectionBusy.add(`${sId}-${day}-${period}-${batch}`);
    if (batch === 'ALL') {
      sectionBusy.add(`${sId}-${day}-${period}-B1`);
      sectionBusy.add(`${sId}-${day}-${period}-B2`);
      sectionBusy.add(`${sId}-${day}-${period}-B3`);
    }
    facultyLoad.set(fId, (facultyLoad.get(fId) || 0) + 1);
  };

  const isAvailable = (fId: string, rId: string, sId: string, day: string, period: number, batch: string = 'ALL') => {
    if (period === LUNCH_PERIOD) return false;
    
    // Check faculty and room
    if (facultyBusy.has(`${fId}-${day}-${period}`)) return false;
    if (roomBusy.has(`${rId}-${day}-${period}`)) return false;

    // Check section/batch conflict
    if (batch === 'ALL') {
      return !sectionBusy.has(`${sId}-${day}-${period}-ALL`) &&
             !sectionBusy.has(`${sId}-${day}-${period}-B1`) &&
             !sectionBusy.has(`${sId}-${day}-${period}-B2`) &&
             !sectionBusy.has(`${sId}-${day}-${period}-B3`);
    } else {
      return !sectionBusy.has(`${sId}-${day}-${period}-ALL`) &&
             !sectionBusy.has(`${sId}-${day}-${period}-${batch}`);
    }
  };

  const canFacultyTakeLoad = (fId: string, additionalLoad: number) => {
    const f = faculty.find(fac => fac.id === fId);
    if (!f) return true;
    const current = facultyLoad.get(fId) || 0;
    return (current + additionalLoad) <= f.weeklyLoad;
  };

  // Helper to shuffle
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  // Scheduling Order: Labs First, then Theory
  sections.forEach(section => {
    const sectionSubjects = subjects.filter(s => 
      s.year === section.year && s.semester === section.semester && (s.section === '' || s.section === section.name)
    );

    // Filter applicable days (4th year holidays)
    const activeDays = section.year === 4 ? DAYS.filter(d => d !== 'FRI' && d !== 'SAT') : DAYS;

    // 1. LAB SCHEDULING (3 Consecutive periods, batched)
    const labs = sectionSubjects.filter(s => s.type === SubjectType.LAB);
    
    // We try to pair up labs for splitting (B1, B2)
    // In practice, if a section has 3 labs, we rotate them: B1=Lab1, B2=Lab2, B3=Lab3
    const labBlocks = [[1, 2, 3], [4, 6, 7]]; // Standard blocks skipping lunch
    
    let labIndex = 0;
    for (const day of shuffle(activeDays)) {
      if (labIndex >= labs.length) break;
      
      for (const block of labBlocks) {
        if (labIndex >= labs.length) break;

        // Try to place up to 3 labs in parallel for batches B1, B2, B3
        const batches = ['B1', 'B2', 'B3'];
        const currentLabsToSchedule = labs.slice(labIndex, labIndex + 3);
        
        // Ensure all labs and rooms are available for the whole block
        let allPossible = true;
        const tempAssignments: any[] = [];

        currentLabsToSchedule.forEach((lab, idx) => {
          const batch = batches[idx];
          const suitableRooms = rooms.filter(r => r.type === SubjectType.LAB && (lab.name.includes('BE') ? r.name.includes('BE') : !r.name.includes('BE')));
          
          let roomFound = false;
          for (const room of suitableRooms) {
            const blockAvailable = block.every(p => isAvailable(lab.assignedFacultyId, room.id, section.id, day, p, batch));
            if (blockAvailable) {
              block.forEach(p => tempAssignments.push({ lab, room, day, p, batch }));
              roomFound = true;
              break;
            }
          }
          if (!roomFound) allPossible = false;
        });

        if (allPossible && tempAssignments.length > 0) {
          tempAssignments.forEach(asgn => {
            result.push({
              id: Math.random().toString(36).substr(2, 9),
              day: asgn.day,
              period: asgn.p,
              subjectId: asgn.lab.id,
              facultyId: asgn.lab.assignedFacultyId,
              roomId: asgn.room.id,
              sectionId: section.id,
              batch: asgn.batch
            });
            markBusy(asgn.lab.assignedFacultyId, asgn.room.id, section.id, asgn.day, asgn.p, asgn.batch);
          });
          labIndex += currentLabsToSchedule.length;
        }
      }
    }

    // 2. THEORY SCHEDULING
    const theories = sectionSubjects.filter(s => s.type === SubjectType.THEORY && s.periodsPerWeek > 0);
    const theoryRoom = rooms.find(r => r.id === section.defaultRoomId) || rooms.find(r => r.type === SubjectType.THEORY)!;

    for (const sub of theories) {
      let remaining = sub.periodsPerWeek;
      const shuffledDays = shuffle(activeDays);
      
      for (const day of shuffledDays) {
        if (remaining <= 0) break;
        
        const slots = shuffle(PERIODS.filter(p => p !== LUNCH_PERIOD));
        for (const p of slots) {
          if (remaining <= 0) break;
          
          if (isAvailable(sub.assignedFacultyId, theoryRoom.id, section.id, day, p, 'ALL') && canFacultyTakeLoad(sub.assignedFacultyId, 1)) {
            result.push({
              id: Math.random().toString(36).substr(2, 9),
              day,
              period: p,
              subjectId: sub.id,
              facultyId: sub.assignedFacultyId,
              roomId: theoryRoom.id,
              sectionId: section.id
            });
            markBusy(sub.assignedFacultyId, theoryRoom.id, section.id, day, p, 'ALL');
            remaining--;
          }
        }
      }
    }

    // 3. FILL GAPS with LIB / SPORTS
    const libSub = subjects.find(s => s.code === 'LIB')!;
    const sportsSub = subjects.find(s => s.code === 'SPORTS')!;
    const libRoom = rooms.find(r => r.name === 'LIBRARY')!;
    const sportsRoom = rooms.find(r => r.name === 'GROUND')!;

    for (const day of activeDays) {
      for (const p of PERIODS) {
        if (p === LUNCH_PERIOD) continue;
        
        // Check if any batch is busy. If not, section is free
        const isFree = !sectionBusy.has(`${section.id}-${day}-${p}-ALL`) && 
                       !sectionBusy.has(`${section.id}-${day}-${p}-B1`);
        
        if (isFree) {
          const sub = Math.random() > 0.3 ? libSub : sportsSub;
          const room = sub.code === 'LIB' ? libRoom : sportsRoom;
          result.push({
            id: Math.random().toString(36).substr(2, 9),
            day,
            period: p,
            subjectId: sub.id,
            facultyId: sub.assignedFacultyId,
            roomId: room.id,
            sectionId: section.id
          });
          markBusy(sub.assignedFacultyId, room.id, section.id, day, p, 'ALL');
        }
      }
    }
  });

  return result;
};
