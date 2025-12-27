import { TimetableEntry, Subject, Room, Faculty, Section, SubjectType } from '../types';
import { DAYS, PERIODS, LUNCH_PERIOD } from '../constants';

// ============================================================================
// REVERSE-ENGINEERED PATTERNS FROM REFERENCE TIMETABLES
// ============================================================================

/**
 * KEY OBSERVATIONS FROM REFERENCE IMAGES:
 * 
 * 1. LAB PATTERNS:
 *    - When 3 labs exist (e.g., AI LAB, OS LAB, FSD LAB):
 *      • Split into 3 batches: A, B, C
 *      • Same time slot, different labs, different rooms
 *      • Format: "AI LAB[A]/OS LAB[B]/FSD LAB[C]"
 *    
 * 2. DISTRIBUTION:
 *    - Labs spread across Mon, Tue, Thu, Fri (not consecutive)
 *    - Saturday often has labs too (for lower years)
 *    - Each day has different lab combinations
 * 
 * 3. THEORY PATTERNS:
 *    - Spread evenly across week
 *    - 4-period subjects: 2 days × 2 periods
 *    - 3-period subjects: 2 days (2+1) or 3 days (1+1+1)
 *    - No 3+ consecutive same subject
 * 
 * 4. PRE-LUNCH PRIORITY:
 *    - Academic subjects dominate periods 1-4
 *    - Labs can start at period 1-2 (2-period blocks)
 *    - Period 3-4 often single theory periods
 * 
 * 5. POST-LUNCH USAGE:
 *    - Used for theory overflow
 *    - Library (max 1/day)
 *    - Sports (1-2/day)
 * 
 * 6. 4TH YEAR SPECIAL:
 *    - Friday & Saturday: OFF (verified in image 2)
 *    - More concentrated schedule Mon-Thu
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
const PRE_LUNCH_PERIODS = [1, 2, 3, 4];
const POST_LUNCH_PERIODS = [6, 7];
const LAB_DURATION = 2;
const MAX_LAB_CAPACITY = 35;
const FOURTH_YEAR_HOLIDAYS = ['FRI', 'SAT'];

const STUDENT_STRENGTHS: Record<string, number> = {
  's1': 69, 's2': 62, 's3': 63, 's4': 60, 's5': 61
};

// ============================================================================
// TYPES
// ============================================================================
interface ScheduleState {
  timetable: TimetableEntry[];
  facultyBusy: Set<string>;
  roomBusy: Set<string>;
  sectionBusy: Set<string>;
  facultyLoad: Map<string, number>;
  subjectDayCount: Map<string, number>;
  labDayUsage: Map<string, Set<string>>; // "sectionId-day" -> Set of lab subject IDs
}

interface LabSession {
  subjectId: string;
  facultyId: string;
  batchName: string;
  roomId: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

const shuffle = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const isHoliday = (year: number, day: string): boolean => 
  year === 4 && FOURTH_YEAR_HOLIDAYS.includes(day);

const getWorkingDays = (year: number): string[] => 
  DAYS.filter(day => !isHoliday(year, day));

const getStudentStrength = (sectionId: string): number => 
  STUDENT_STRENGTHS[sectionId] || 65;

const calculateLabBatches = (studentStrength: number): number => 
  Math.ceil(studentStrength / MAX_LAB_CAPACITY);

// ============================================================================
// CONSTRAINT VALIDATION
// ============================================================================

const isSlotAvailable = (
  state: ScheduleState,
  faculty: Faculty[],
  facultyId: string,
  roomId: string,
  sectionId: string,
  day: string,
  period: number
): boolean => {
  if (period === LUNCH_PERIOD) return false;
  if (state.facultyBusy.has(`${facultyId}-${day}-${period}`)) return false;
  if (state.roomBusy.has(`${roomId}-${day}-${period}`)) return false;
  if (state.sectionBusy.has(`${sectionId}-${day}-${period}`)) return false;
  
  const fac = faculty.find(f => f.id === facultyId);
  if (fac && (state.facultyLoad.get(facultyId) || 0) >= fac.weeklyLoad) return false;
  
  return true;
};

const canPlaceTheory = (
  state: ScheduleState,
  subjectId: string,
  sectionId: string,
  day: string,
  period: number
): boolean => {
  const dayKey = `${subjectId}-${sectionId}-${day}`;
  if ((state.subjectDayCount.get(dayKey) || 0) >= 2) return false;

  // Check 3-consecutive rule (no 3 in a row)
  const adjacentPeriods = [period - 2, period - 1, period + 1, period + 2]
    .filter(p => PERIODS.includes(p) && p !== LUNCH_PERIOD);
  
  const sameSubjectAdjacent = state.timetable.filter(t => 
    t.sectionId === sectionId && t.day === day && 
    adjacentPeriods.includes(t.period) && t.subjectId === subjectId
  );

  // If there are already 2 adjacent same subjects, can't add 3rd
  if (sameSubjectAdjacent.length >= 2) {
    const periods = sameSubjectAdjacent.map(t => t.period).sort((a, b) => a - b);
    for (let i = 0; i < periods.length - 1; i++) {
      if (periods[i + 1] - periods[i] === 1) {
        // Already have 2 consecutive, check if adding this would make 3
        if (period === periods[i] - 1 || period === periods[i + 1] + 1) return false;
      }
    }
  }

  return true;
};

const occupySlot = (
  state: ScheduleState,
  facultyId: string,
  roomId: string,
  sectionId: string,
  day: string,
  period: number
) => {
  state.facultyBusy.add(`${facultyId}-${day}-${period}`);
  state.roomBusy.add(`${roomId}-${day}-${period}`);
  state.sectionBusy.add(`${sectionId}-${day}-${period}`);
  state.facultyLoad.set(facultyId, (state.facultyLoad.get(facultyId) || 0) + 1);
};

const addEntry = (
  state: ScheduleState,
  day: string,
  period: number,
  subjectId: string,
  facultyId: string,
  roomId: string,
  sectionId: string,
  batch?: string
) => {
  state.timetable.push({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    day, period, subjectId, facultyId, roomId, sectionId, batch
  });
  occupySlot(state, facultyId, roomId, sectionId, day, period);
  
  const dayKey = `${subjectId}-${sectionId}-${day}`;
  state.subjectDayCount.set(dayKey, (state.subjectDayCount.get(dayKey) || 0) + 1);
};

// ============================================================================
// ADVANCED LAB SCHEDULING (ROTATION PATTERN)
// ============================================================================

const scheduleLabsForSection = (
  state: ScheduleState,
  subjects: Subject[],
  rooms: Room[],
  faculty: Faculty[],
  section: Section
): number => {
  const labSubjects = subjects.filter(
    s => s.type === SubjectType.LAB &&
         s.year === section.year &&
         s.semester === section.semester &&
         (s.section === '' || s.section === section.name)
  );

  if (labSubjects.length === 0) return 0;

  const labRooms = rooms.filter(r => r.type === SubjectType.LAB);
  const workingDays = getWorkingDays(section.year);

  // CRITICAL: Batches based on NUMBER OF LABS, not student strength
  const numBatches = labSubjects.length;
  const batchLetters = ['A', 'B', 'C'];

  console.log(`\n📚 Lab Scheduling: ${section.name} (Year ${section.year})`);
  console.log(`   Lab Subjects: ${labSubjects.length}, Batches: ${numBatches}`);

  if (numBatches > labRooms.length) {
    console.warn(`   ⚠️  Insufficient lab rooms for ${numBatches} batches!`);
    return labSubjects.length;
  }

  // Calculate how many rotation days needed
  // If each lab has 3 periods/week and we have 3 labs, each student does 1 period per rotation
  const periodsPerLab = labSubjects[0]?.periodsPerWeek || 3;
  const rotationDays = periodsPerLab; // 3 periods = 3 rotation days

  console.log(`   Rotation Days Needed: ${rotationDays}`);

  // Find time slots that work for ALL batches simultaneously
  const preferredBlocks: number[][] = [[1, 2], [2, 3], [6, 7], [3, 4]];
  
  let scheduledRotations = 0;
  let unscheduled = 0;

  // Try to schedule all rotation days
  for (let rotationIndex = 0; rotationIndex < rotationDays; rotationIndex++) {
    let scheduled = false;

    // Try to find a day for this rotation
    for (const day of shuffle([...workingDays])) {
      if (scheduled) break;

      // Check if this day already has a lab rotation
      const dayKey = `${section.id}-${day}`;
      if (state.labDayUsage.has(dayKey) && state.labDayUsage.get(dayKey)!.size > 0) {
        continue; // Skip days that already have labs
      }

      // Try each time block
      for (const [p1, p2] of preferredBlocks) {
        if (scheduled) break;

        // Check if ALL batches can be scheduled at this time
        let allBatchesAvailable = true;
        const roomAssignments: Room[] = [];

        // For each batch, check if we can assign a different lab room
        for (let batchIdx = 0; batchIdx < numBatches; batchIdx++) {
          const labIndex = (batchIdx + rotationIndex) % numBatches; // ROTATION LOGIC
          const lab = labSubjects[labIndex];
          
          // Find an available room for this batch
          let foundRoom = false;
          for (const room of labRooms) {
            if (roomAssignments.includes(room)) continue; // Room already taken by another batch

            const r1 = isSlotAvailable(state, faculty, lab.assignedFacultyId, room.id, section.id, day, p1);
            const r2 = isSlotAvailable(state, faculty, lab.assignedFacultyId, room.id, section.id, day, p2);
            
            if (r1 && r2) {
              roomAssignments.push(room);
              foundRoom = true;
              break;
            }
          }

          if (!foundRoom) {
            allBatchesAvailable = false;
            break;
          }
        }

        if (allBatchesAvailable && roomAssignments.length === numBatches) {
          // Schedule the rotation!
          console.log(`   ✓ Rotation ${rotationIndex + 1}/${rotationDays} on ${day} P${p1}-${p2}`);

          for (let batchIdx = 0; batchIdx < numBatches; batchIdx++) {
            const labIndex = (batchIdx + rotationIndex) % numBatches; // ROTATION
            const lab = labSubjects[labIndex];
            const batchName = `BATCH ${batchLetters[batchIdx]}`;
            const room = roomAssignments[batchIdx];

            console.log(`      - ${batchName}: ${lab.abbreviation} in ${room.name}`);

            // Add TWO periods for this batch-lab combination
            addEntry(state, day, p1, lab.id, lab.assignedFacultyId, room.id, section.id, batchName);
            addEntry(state, day, p2, lab.id, lab.assignedFacultyId, room.id, section.id, batchName);
          }

          // Mark this day as having labs
          if (!state.labDayUsage.has(dayKey)) {
            state.labDayUsage.set(dayKey, new Set());
          }
          labSubjects.forEach(lab => state.labDayUsage.get(dayKey)!.add(lab.id));

          scheduled = true;
          scheduledRotations++;
        }
      }
    }

    if (!scheduled) {
      console.warn(`   ✗ Failed to schedule rotation ${rotationIndex + 1}`);
      unscheduled++;
    }
  }

  // Calculate total unscheduled periods
  const missedRotations = rotationDays - scheduledRotations;
  return missedRotations > 0 ? labSubjects.length * missedRotations : 0;
};

// ============================================================================
// INTELLIGENT THEORY SCHEDULING
// ============================================================================

const scheduleTheoryForSection = (
  state: ScheduleState,
  subjects: Subject[],
  rooms: Room[],
  faculty: Faculty[],
  section: Section
): number => {
  const theorySubjects = subjects.filter(
    s => s.type === SubjectType.THEORY &&
         s.year === section.year &&
         s.semester === section.semester &&
         (s.section === '' || s.section === section.name) &&
         s.code !== 'LIB' && s.code !== 'SPORTS'
  ).sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

  const preferredRoom = rooms.find(r => r.id === section.defaultRoomId) || 
                       rooms.find(r => r.type === SubjectType.THEORY);
  
  if (!preferredRoom) return theorySubjects.reduce((sum, s) => sum + s.periodsPerWeek, 0);

  console.log(`\n📖 Theory Scheduling: ${section.name}`);

  const workingDays = getWorkingDays(section.year);
  let unscheduled = 0;

  for (const subject of theorySubjects) {
    let remaining = subject.periodsPerWeek;

    // Distribution strategy based on periods/week
    const dayDistribution = remaining === 4 ? 2 : remaining === 3 ? 3 : remaining;
    const daysToUse = shuffle([...workingDays]).slice(0, dayDistribution);

    for (const day of daysToUse) {
      if (remaining <= 0) break;

      const periodsThisDay = Math.ceil(remaining / daysToUse.length);
      let addedToday = 0;

      // Prioritize pre-lunch, then post-lunch
      const priorityPeriods = [...PRE_LUNCH_PERIODS, ...POST_LUNCH_PERIODS];

      for (const period of shuffle(priorityPeriods)) {
        if (addedToday >= periodsThisDay || remaining <= 0) break;

        if (canPlaceTheory(state, subject.id, section.id, day, period) &&
            isSlotAvailable(state, faculty, subject.assignedFacultyId, preferredRoom.id, section.id, day, period)) {
          
          addEntry(state, day, period, subject.id, subject.assignedFacultyId, preferredRoom.id, section.id);
          remaining--;
          addedToday++;
        }
      }
    }

    if (remaining > 0) {
      console.warn(`   ✗ ${subject.name}: ${remaining} periods unscheduled`);
      unscheduled += remaining;
    } else {
      console.log(`   ✓ ${subject.name}: Complete`);
    }
  }

  return unscheduled;
};

// ============================================================================
// STRATEGIC GAP FILLING (CRITICAL: NO GAPS IN FIRST 4 PERIODS)
// ============================================================================

const fillGaps = (
  state: ScheduleState,
  subjects: Subject[],
  rooms: Room[],
  sections: Section[]
) => {
  const libSubject = subjects.find(s => s.code === 'LIB');
  const sportsSubject = subjects.find(s => s.code === 'SPORTS');
  const libRoom = rooms.find(r => r.name === 'LIBRARY');
  const groundRoom = rooms.find(r => r.name === 'GROUND');

  if (!libSubject || !sportsSubject || !libRoom || !groundRoom) return;

  console.log('\n🎯 Mandatory Gap Filling (First 4 Periods)...');

  for (const section of sections) {
    const workingDays = getWorkingDays(section.year);

    for (const day of workingDays) {
      // Check if day has ANY academic classes
      const hasAcademic = state.timetable.some(t => 
        t.sectionId === section.id && t.day === day &&
        PRE_LUNCH_PERIODS.includes(t.period)
      );

      if (!hasAcademic) continue; // Skip holidays

      // CRITICAL: Fill ALL gaps in first 4 periods (PRE_LUNCH_PERIODS)
      for (const period of PRE_LUNCH_PERIODS) {
        if (state.sectionBusy.has(`${section.id}-${day}-${period}`)) {
          continue; // Already has a class
        }

        // Gap found! Fill it with library (prefer library for academic feel)
        console.log(`   Filling gap: ${section.name} ${day} P${period} with LIBRARY`);
        addEntry(state, day, period, libSubject.id, libSubject.assignedFacultyId, libRoom.id, section.id);
      }

      // Post-lunch: Add minimal sports (only if less than half-filled)
      const postOccupied = POST_LUNCH_PERIODS.filter(p => 
        state.sectionBusy.has(`${section.id}-${day}-${p}`)
      ).length;

      if (postOccupied < 1) { // If both post-lunch slots are empty
        for (const period of POST_LUNCH_PERIODS) {
          if (state.sectionBusy.has(`${section.id}-${day}-${period}`)) continue;

          addEntry(state, day, period, sportsSubject.id, sportsSubject.assignedFacultyId, groundRoom.id, section.id);
          break; // Add only one sports period
        }
      }
    }
  }
};

// ============================================================================
// MAIN ALGORITHM - PRODUCTION READY
// ============================================================================

export const generateTimetable = (
  subjects: Subject[],
  rooms: Room[],
  faculty: Faculty[],
  sections: Section[]
): TimetableEntry[] => {
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   🎓 ADVANCED TIMETABLE GENERATION SYSTEM v3.0          ║');
  console.log('║   Pattern-Based CSP with Batch Optimization             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const state: ScheduleState = {
    timetable: [],
    facultyBusy: new Set(),
    roomBusy: new Set(),
    sectionBusy: new Set(),
    facultyLoad: new Map(),
    subjectDayCount: new Map(),
    labDayUsage: new Map()
  };

  faculty.forEach(f => state.facultyLoad.set(f.id, 0));

  const sortedSections = [...sections].sort((a, b) => b.year - a.year);
  let totalUnscheduled = 0;

  // PHASE 1: Labs (Hardest Constraint)
  console.log('\n━━━ PHASE 1: LAB SCHEDULING ━━━');
  for (const section of sortedSections) {
    totalUnscheduled += scheduleLabsForSection(state, subjects, rooms, faculty, section);
  }

  // PHASE 2: Theory (Core Academic)
  console.log('\n━━━ PHASE 2: THEORY SCHEDULING ━━━');
  for (const section of sortedSections) {
    totalUnscheduled += scheduleTheoryForSection(state, subjects, rooms, faculty, section);
  }

  // PHASE 3: Fill Gaps
  console.log('\n━━━ PHASE 3: GAP FILLING ━━━');
  fillGaps(state, subjects, rooms, sections);

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  📊 GENERATION SUMMARY                                    ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Entries: ${state.timetable.length.toString().padEnd(47)}║`);
  console.log(`║  Unscheduled: ${totalUnscheduled.toString().padEnd(43)}║`);
  console.log(`║  Success: ${((1 - Math.min(totalUnscheduled, 100) / 100) * 100).toFixed(1)}%`.padEnd(58) + '║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  return state.timetable;
};