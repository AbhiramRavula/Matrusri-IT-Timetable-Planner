
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  DoorOpen, 
  Calendar, 
  History, 
  Settings, 
  LogOut, 
  User as UserIcon,
  ChevronRight,
  Plus,
  Zap,
  CheckCircle2,
  FileDown,
  Globe,
  MessageSquareText,
  X,
  AlertCircle,
  Edit,
  Trash2,
  Save,
  Download,
  GraduationCap,
  Search
} from 'lucide-react';
import { 
  User, 
  UserRole, 
  AppState, 
  Faculty, 
  Subject, 
  Room, 
  Section, 
  TimetableEntry, 
  ChangeLog,
  SubjectType,
  StudentGroup
} from './types';
import { 
  INITIAL_FACULTY, 
  INITIAL_ROOMS, 
  INITIAL_SECTIONS, 
  INITIAL_SUBJECTS, 
  INITIAL_STUDENTS,
  DAYS, 
  PERIODS, 
  LUNCH_PERIOD,
  PERIOD_TIMES
} from './constants';
import { generateTimetable } from './utils/scheduler';
import { getGeminiAssistance } from './services/geminiService';

// --- Sub-components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

const Card = ({ title, children, extra }: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
      <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">{title}</h3>
      {extra}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const SearchInput = ({ value, onChange, placeholder }: any) => (
  <div className="relative mb-6">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-medium text-slate-900 transition-all shadow-sm placeholder:text-slate-400"
    />
  </div>
);

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [state, setState] = useState<AppState>({
    users: [],
    faculty: INITIAL_FACULTY,
    subjects: INITIAL_SUBJECTS,
    rooms: INITIAL_ROOMS,
    sections: INITIAL_SECTIONS,
    students: INITIAL_STUDENTS,
    timetable: [],
    logs: [],
    isPublished: false,
  });

  const [aiResponse, setAiResponse] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [facultySearch, setFacultySearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [editingEntry, setEditingEntry] = useState<{ entry: TimetableEntry; sectionId: string; day: string; period: number; } | null>(null);
  const [entityModal, setEntityModal] = useState<{ type: 'faculty' | 'subject' | 'room' | 'student'; data: any; } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('matrusri_timetable_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.timetable) setState(parsed);
      } catch (e) { console.error("Failed to parse saved state", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('matrusri_timetable_data', JSON.stringify(state));
  }, [state]);

  const handleLogin = (role: UserRole) => {
    const mockUser: User = {
      id: 'u1',
      name: role === UserRole.ADMIN ? 'HoD IT' : 'Dr. Ramesh',
      email: role === UserRole.ADMIN ? 'hod.it@matrusri.edu.in' : 'ramesh@matrusri.edu.in',
      role: role,
    };
    setCurrentUser(mockUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('public');
  };

  const onGenerate = () => {
    const newTimetable = generateTimetable(state.subjects, state.rooms, state.faculty, state.sections);
    setState(prev => ({ 
      ...prev, 
      timetable: newTimetable,
      logs: [{ 
        id: Date.now().toString(), 
        timestamp: new Date().toISOString(), 
        user: currentUser?.name || 'System', 
        description: 'Regenerated full department timetable' 
      }, ...prev.logs]
    }));
  };

  const askGemini = async () => {
    setIsAiLoading(true);
    const prompt = `Analyze current IT department timetable. Suggest improvements for practical application.`;
    const res = await getGeminiAssistance(prompt);
    setAiResponse(res);
    setIsAiLoading(false);
  };

  const handleEditCell = (sectionId: string, day: string, period: number, existingEntry?: TimetableEntry) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    setEditingEntry({
      entry: existingEntry || { id: Math.random().toString(36).substr(2, 9), day, period, subjectId: '', facultyId: '', roomId: '', sectionId },
      sectionId, day, period
    });
  };

  const validateAndSaveEntry = (updatedEntry: TimetableEntry) => {
    setState(prev => {
      const existingIdx = prev.timetable.findIndex(t => t.id === updatedEntry.id);
      let newTimetable = [...prev.timetable];
      if (existingIdx >= 0) newTimetable[existingIdx] = updatedEntry;
      else newTimetable.push(updatedEntry);
      return { ...prev, timetable: newTimetable, logs: [{ id: Date.now().toString(), timestamp: new Date().toISOString(), user: currentUser?.name || 'Admin', description: `Modified slot: ${updatedEntry.day} P${updatedEntry.period}` }, ...prev.logs] };
    });
    setEditingEntry(null);
    return true;
  };

  const removeEntry = (id: string) => {
    setState(prev => ({ ...prev, timetable: prev.timetable.filter(t => t.id !== id) }));
    setEditingEntry(null);
  };

  const saveFaculty = (f: Faculty) => setState(p => ({ ...p, faculty: p.faculty.some(x => x.id === f.id) ? p.faculty.map(x => x.id === f.id ? f : x) : [...p.faculty, f] }));
  const deleteFaculty = (id: string) => {
    if (window.confirm("Are you sure you want to delete this faculty member? This will not remove them from existing timetable slots.")) {
      setState(p => ({ ...p, faculty: p.faculty.filter(f => f.id !== id) }));
    }
  };

  const saveSubject = (s: Subject) => setState(p => ({ ...p, subjects: p.subjects.some(x => x.id === s.id) ? p.subjects.map(x => x.id === s.id ? s : x) : [...p.subjects, s] }));
  const deleteSubject = (id: string) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      setState(p => ({ ...p, subjects: p.subjects.filter(s => s.id !== id) }));
    }
  };

  const saveRoom = (r: Room) => setState(p => ({ ...p, rooms: p.rooms.some(x => x.id === r.id) ? p.rooms.map(x => x.id === r.id ? r : x) : [...p.rooms, r] }));
  const deleteRoom = (id: string) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      setState(p => ({ ...p, rooms: p.rooms.filter(r => r.id !== id) }));
    }
  };

  const saveStudent = (s: StudentGroup) => setState(p => ({ ...p, students: p.students.some(x => x.id === s.id) ? p.students.map(x => x.id === s.id ? s : x) : [...p.students, s] }));
  const deleteStudent = (id: string) => {
    if (window.confirm("Are you sure you want to delete this student group?")) {
      setState(p => ({ ...p, students: p.students.filter(st => st.id !== id) }));
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-10 border border-slate-200">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-200">
              <Calendar size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-center text-slate-900 mb-2 tracking-tight">Matrusri Engineering</h1>
          <p className="text-center text-slate-500 mb-10 font-semibold uppercase tracking-widest text-[10px]">IT Department Timetable Planner</p>
          <div className="space-y-4">
            <button onClick={() => handleLogin(UserRole.ADMIN)} className="w-full py-4.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all flex items-center justify-between shadow-xl shadow-blue-100">
              <span>Admin (HoD) Access</span>
              <ChevronRight size={20} />
            </button>
            <button onClick={() => handleLogin(UserRole.FACULTY)} className="w-full py-4.5 px-6 bg-white border-2 border-slate-100 hover:border-blue-600 text-slate-800 font-bold rounded-2xl transition-all flex items-center justify-between">
              <span>Faculty Member</span>
              <ChevronRight size={20} />
            </button>
            <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div><div className="relative flex justify-center text-[10px]"><span className="px-3 bg-white text-slate-400 uppercase tracking-widest font-black">Public Dashboard</span></div></div>
            <button onClick={() => setActiveTab('public')} className="w-full py-4.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-center">
              Student Timetables
            </button>
          </div>
        </div>
        {activeTab === 'public' && (
           <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-10">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200"><Calendar size={24} /></div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Public Board</h2>
                  </div>
                  <button onClick={() => { setActiveTab('dashboard'); setCurrentUser(null); }} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg">Return to Login</button>
                </div>
                <PublicTimetable state={state} />
              </div>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 shadow-sm z-40">
        <div className="p-8 flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Calendar size={20} /></div>
          <span className="text-xl font-black text-slate-900 tracking-tight">MEC IT</span>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          {currentUser?.role === UserRole.ADMIN && (
            <>
              <div className="pt-6 pb-2 px-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department Setup</span></div>
              <SidebarItem icon={Users} label="Faculty" active={activeTab === 'faculty'} onClick={() => setActiveTab('faculty')} />
              <SidebarItem icon={BookOpen} label="Subjects" active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} />
              <SidebarItem icon={DoorOpen} label="Rooms" active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
              <SidebarItem icon={GraduationCap} label="Students" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
              <div className="pt-6 pb-2 px-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</span></div>
              <SidebarItem icon={Calendar} label="Generate" active={activeTab === 'generate'} onClick={() => setActiveTab('generate')} />
              <SidebarItem icon={History} label="Audit Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
            </>
          )}
        </nav>
        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">{currentUser?.name?.charAt(0)}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-slate-900 truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{currentUser?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 py-3.5 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-12 min-h-screen">
        <header className="mb-12 flex justify-between items-center">
          <h2 className="text-4xl font-black text-slate-900 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
        </header>

        <div className="animate-in fade-in duration-700">
          {activeTab === 'dashboard' && <Dashboard state={state} />}
          {activeTab === 'faculty' && (
            <>
              <SearchInput value={facultySearch} onChange={setFacultySearch} placeholder="Search faculty by name..." />
              <FacultyList 
                faculty={state.faculty.filter(f => f.name.toLowerCase().includes(facultySearch.toLowerCase()))} 
                onEdit={(f: Faculty) => setEntityModal({ type: 'faculty', data: f })}
                onDelete={deleteFaculty}
                onAdd={() => setEntityModal({ type: 'faculty', data: { id: Math.random().toString(36).substr(2, 9), name: '', email: '', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 24 } })}
              />
            </>
          )}
          {activeTab === 'subjects' && (
            <>
              <SearchInput value={subjectSearch} onChange={setSubjectSearch} placeholder="Search course code or name..." />
              <SubjectList 
                subjects={state.subjects.filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase()) || s.code.toLowerCase().includes(subjectSearch.toLowerCase()))} 
                onEdit={(s: Subject) => setEntityModal({ type: 'subject', data: s })}
                onDelete={deleteSubject}
                onAdd={() => setEntityModal({ type: 'subject', data: { id: Math.random().toString(36).substr(2, 9), code: '', name: '', abbreviation: '', type: SubjectType.THEORY, year: 3, semester: 5, section: 'A', periodsPerWeek: 3, assignedFacultyId: '' } })}
              />
            </>
          )}
          {activeTab === 'rooms' && (
            <>
              <SearchInput value={roomSearch} onChange={setRoomSearch} placeholder="Search rooms by name..." />
              <RoomList 
                rooms={state.rooms.filter(r => r.name.toLowerCase().includes(roomSearch.toLowerCase()))} 
                onEdit={(r: Room) => setEntityModal({ type: 'room', data: r })}
                onDelete={deleteRoom}
                onAdd={() => setEntityModal({ type: 'room', data: { id: Math.random().toString(36).substr(2, 9), name: '', type: SubjectType.THEORY, capacity: 60 } })}
              />
            </>
          )}
          {activeTab === 'students' && (
             <>
                <SearchInput value={studentSearch} onChange={setStudentSearch} placeholder="Search by roll number or section..." />
                <StudentList 
                    students={state.students.filter(s => s.rollRange.toLowerCase().includes(studentSearch.toLowerCase()))}
                    sections={state.sections}
                    onEdit={(s: StudentGroup) => setEntityModal({ type: 'student', data: s })}
                    onDelete={deleteStudent}
                    onAdd={() => setEntityModal({ type: 'student', data: { id: Math.random().toString(36).substr(2, 9), sectionId: '', year: 4, semester: 7, strength: 60, rollRange: '' } })}
                />
             </>
          )}
          {activeTab === 'generate' && (
            <div className="space-y-12">
              <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Department Scheduler</h3>
                  <p className="text-slate-500 font-medium">Auto-generate conflict-free academic sessions</p>
                </div>
                <div className="flex space-x-4">
                   <button onClick={askGemini} disabled={isAiLoading} className="flex items-center space-x-2 px-6 py-3.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-2xl font-black transition-all border border-indigo-100 text-sm">
                    <Zap size={18} />
                    <span>AI Audit</span>
                  </button>
                  <button onClick={onGenerate} className="flex items-center space-x-2 px-8 py-3.5 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-black shadow-xl shadow-blue-100 transition-all text-sm">
                    <Plus size={18} />
                    <span>Execute Engine</span>
                  </button>
                </div>
              </div>
              {state.timetable.length > 0 && state.sections.map(section => (
                <SectionTimetable key={section.id} section={section} timetable={state.timetable.filter(t => t.sectionId === section.id)} subjects={state.subjects} rooms={state.rooms} faculty={state.faculty} onEditCell={handleEditCell} />
              ))}
            </div>
          )}
          {activeTab === 'logs' && <AuditLogs logs={state.logs} />}
        </div>
      </main>

      {editingEntry && (
        <EditEntryModal editing={editingEntry} facultyList={state.faculty} subjectList={state.subjects} onClose={() => setEditingEntry(null)} onSave={validateAndSaveEntry} onRemove={removeEntry} />
      )}
      {entityModal && (
        <EntityModal modal={entityModal} onClose={() => setEntityModal(null)} onSave={(data: any) => { 
          if (entityModal.type === 'faculty') saveFaculty(data); 
          if (entityModal.type === 'subject') saveSubject(data); 
          if (entityModal.type === 'room') saveRoom(data); 
          if (entityModal.type === 'student') saveStudent(data); 
          setEntityModal(null); 
        }} facultyList={state.faculty} sections={state.sections} />
      )}
    </div>
  );
}

// --- List View Components ---

const FacultyList = ({ faculty, onEdit, onDelete, onAdd }: any) => (
  <Card title="Faculty directory" extra={<button onClick={onAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-100 flex items-center uppercase tracking-widest"><Plus size={16} className="mr-2" /> Add Faculty</button>}>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="text-[10px] uppercase text-slate-500 font-black border-b border-slate-100 tracking-widest bg-slate-50/50">
          <tr><th className="px-4 py-5">Instructor Name</th><th className="px-4 py-5">College Email</th><th className="px-4 py-5">Status</th><th className="px-4 py-5 text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {faculty.map((f: any) => (
            <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-5 font-black text-slate-900 uppercase tracking-tight">{f.name}</td>
              <td className="px-4 py-5 text-slate-600 font-medium">{f.email}</td>
              <td className="px-4 py-5">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${f.department === 'IT' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{f.department === 'IT' ? 'IT DEPT' : f.department}</span>
              </td>
              <td className="px-4 py-5 text-right">
                <div className="flex justify-end space-x-2">
                  <button onClick={() => onEdit(f)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit"><Edit size={18}/></button>
                  <button onClick={() => onDelete(f.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete"><Trash2 size={18}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const SubjectList = ({ subjects, onEdit, onDelete, onAdd }: any) => (
  <Card title="Course management" extra={<button onClick={onAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-100 flex items-center uppercase tracking-widest"><Plus size={16} className="mr-2" /> Add Course</button>}>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="text-[10px] uppercase text-slate-500 font-black border-b border-slate-100 tracking-widest bg-slate-50/50">
          <tr><th className="px-4 py-5">Code</th><th className="px-4 py-5">Subject Title</th><th className="px-4 py-5 text-center">Modality</th><th className="px-4 py-5 text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {subjects.map((s: any) => (
            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-5 font-black text-blue-600 tracking-widest">{s.code}</td>
              <td className="px-4 py-5 text-slate-900 font-bold uppercase tracking-tight">{s.name} <span className="text-[10px] text-slate-400 font-black">({s.abbreviation})</span></td>
              <td className="px-4 py-5 text-center">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${s.type === 'Theory' ? 'bg-orange-50 text-orange-700' : 'bg-purple-50 text-purple-700'}`}>{s.type}</span>
              </td>
              <td className="px-4 py-5 text-right">
                <div className="flex justify-end space-x-2">
                  <button onClick={() => onEdit(s)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit"><Edit size={18}/></button>
                  <button onClick={() => onDelete(s.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete"><Trash2 size={18}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const RoomList = ({ rooms, onEdit, onDelete, onAdd }: any) => (
  <Card title="Infrastructure: Rooms" extra={<button onClick={onAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-100 flex items-center uppercase tracking-widest"><Plus size={16} className="mr-2" /> Add Room</button>}>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="text-[10px] uppercase text-slate-500 font-black border-b border-slate-100 tracking-widest bg-slate-50/50">
          <tr><th className="px-4 py-5">Room Identifier</th><th className="px-4 py-5">Facility Type</th><th className="px-4 py-5 text-center">Capacity</th><th className="px-4 py-5 text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {rooms.map((r: any) => (
            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-5 font-black text-slate-900 uppercase tracking-tight">{r.name}</td>
              <td className="px-4 py-5">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${r.type === 'Theory' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{r.type}</span>
              </td>
              <td className="px-4 py-5 text-center font-black text-slate-900">{r.capacity} Seats</td>
              <td className="px-4 py-5 text-right">
                <div className="flex justify-end space-x-2">
                  <button onClick={() => onEdit(r)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit"><Edit size={18}/></button>
                  <button onClick={() => onDelete(r.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete"><Trash2 size={18}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const StudentList = ({ students, sections, onEdit, onDelete, onAdd }: any) => (
  <Card title="Student metadata" extra={<button onClick={onAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-100 flex items-center uppercase tracking-widest"><Plus size={16} className="mr-2" /> Add Record</button>}>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="text-[10px] uppercase text-slate-500 font-black border-b border-slate-100 tracking-widest bg-slate-50/50">
          <tr><th className="px-4 py-5">Section</th><th className="px-4 py-5">Semester</th><th className="px-4 py-5 text-center">Batch Strength</th><th className="px-4 py-5">Roll ID Range</th><th className="px-4 py-5 text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {students.map((s: any) => {
            const sec = sections.find((x: any) => x.id === s.sectionId);
            return (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-5 font-black text-slate-900 uppercase">Sec {sec?.name || '??'}</td>
                <td className="px-4 py-5 text-slate-900 font-bold">SEM {s.semester}</td>
                <td className="px-4 py-5 text-center font-black text-slate-900">{s.strength} Students</td>
                <td className="px-4 py-5 text-slate-500 font-medium text-xs font-mono">{s.rollRange}</td>
                <td className="px-4 py-5 text-right">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => onEdit(s)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit"><Edit size={18}/></button>
                    <button onClick={() => onDelete(s.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete"><Trash2 size={18}/></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </Card>
);

const Dashboard = ({ state }: { state: AppState }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
    {[
      { label: 'Total Faculty', count: state.faculty.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Active Courses', count: state.subjects.length, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Infrastructure', count: state.rooms.length, icon: DoorOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'Student Sections', count: state.sections.length, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ].map((item, i) => (
      <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 group hover:shadow-md transition-all">
        <div className={`${item.bg} ${item.color} p-4 rounded-2xl w-fit mb-6`}><item.icon size={28} /></div>
        <h4 className="text-4xl font-black text-slate-900 tracking-tight">{item.count}</h4>
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mt-2">{item.label}</p>
      </div>
    ))}
  </div>
);

const SectionTimetable = ({ section, timetable, subjects, rooms, faculty, onEditCell }: any) => {
  const getEntries = (day: string, period: number) => timetable.filter((t: any) => t.day === day && t.period === period);
  const classTeacher = faculty.find((f: any) => f.id === section.classTeacherId);
  const sectionRoom = rooms.find((r: any) => r.id === section.defaultRoomId);
  const sectionSubjects = subjects.filter((s: any) => s.year === section.year && s.semester === section.semester && (s.section === '' || s.section === section.name));

  return (
    <div className="space-y-8 mt-16 first:mt-0">
      <div className="bg-white border-2 border-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b-2 border-slate-900 flex justify-between items-end bg-slate-50/50">
          <div>
            <div className="flex items-baseline space-x-2"><span className="text-[10px] font-black uppercase text-slate-400">BATCH GROUP:</span><span className="font-black text-slate-900 text-lg">B.E SEM-{section.semester} • IT SEC-{section.name}</span></div>
            <div className="flex items-baseline space-x-2"><span className="text-[10px] font-black uppercase text-slate-400">ALLOCATED ROOM:</span><span className="font-black text-slate-900 text-sm uppercase">{sectionRoom?.name || 'Unassigned'}</span></div>
          </div>
          <div className="text-right">
             <div className="flex items-baseline space-x-2 justify-end"><span className="text-[10px] font-black uppercase text-slate-400">CLASS TEACHER:</span><span className="font-black text-slate-900 text-sm uppercase">{classTeacher?.name || 'Pending...'}</span></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-bold border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100">
                <th className="p-4 border-r-2 border-slate-900 text-slate-900 uppercase w-28 bg-slate-200/50">TIMINGS</th>
                {PERIODS.map((p, idx) => (
                  <th key={p} className={`p-4 border-r-2 last:border-r-0 border-slate-900 text-slate-900 text-[10px] ${p === LUNCH_PERIOD ? 'w-20 bg-slate-300' : ''}`}>
                    {p === LUNCH_PERIOD ? 'LUNCH' : PERIOD_TIMES[idx]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day} className="border-b-2 last:border-b-0 border-slate-900">
                  <td className="p-4 border-r-2 border-slate-900 bg-slate-50 text-slate-900 font-black text-center">{day}</td>
                  {PERIODS.map(p => {
                    if (p === LUNCH_PERIOD) return <td key={p} className="bg-slate-300 border-r-2 border-slate-900"></td>;
                    const entries = getEntries(day, p);
                    return (
                      <td key={p} onClick={() => onEditCell(section.id, day, p, entries[0])} className="p-0 border-r-2 last:border-r-0 border-slate-900 min-w-[150px] h-24 text-center cursor-pointer hover:bg-blue-50 transition-all bg-white group">
                        {entries.length > 0 ? (
                          <div className={`h-full flex ${entries.length > 1 ? 'divide-x-2 divide-slate-200' : ''}`}>
                            {entries.map((entry, idx) => {
                               const sub = subjects.find((s: any) => s.id === entry.subjectId);
                               const fac = faculty.find((f: any) => f.id === entry.facultyId);
                               return (
                                 <div key={idx} className="flex-1 flex flex-col items-center justify-center p-2">
                                    <span className="text-slate-900 font-black text-[12px] leading-tight uppercase tracking-tight">{sub?.abbreviation}</span>
                                    {entry.batch && <span className="text-[9px] text-blue-700 font-black bg-blue-50 px-1 rounded mt-1">BATCH {entry.batch}</span>}
                                    <span className="text-[8px] text-slate-500 uppercase font-bold mt-1">{fac?.name?.split(' ').pop()}</span>
                                 </div>
                               );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-200 group-hover:text-blue-300"><Plus size={16} /></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white border-2 border-slate-900 rounded-2xl overflow-hidden shadow-lg">
        <table className="w-full text-[11px] font-bold">
          <thead className="bg-slate-100 border-b-2 border-slate-900">
            <tr className="uppercase tracking-widest text-[9px] text-slate-600">
              <th className="p-3 border-r-2 border-slate-900 w-12 text-center">No.</th>
              <th className="p-3 border-r-2 border-slate-900 w-28 text-center">Sub Code</th>
              <th className="p-3 border-r-2 border-slate-900 text-left px-5">Subject Name</th>
              <th className="p-3 border-r-2 border-slate-900 w-24 text-center">Abbr.</th>
              <th className="p-3 text-left px-5">Faculty Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-900">
            {sectionSubjects.map((s: any, idx: number) => {
              const fac = faculty.find((f: any) => f.id === s.assignedFacultyId);
              return (
                <tr key={s.id} className="uppercase hover:bg-slate-50 transition-colors">
                  <td className="p-3 border-r-2 border-slate-900 text-center text-slate-500 font-black">{idx + 1}</td>
                  <td className="p-3 border-r-2 border-slate-900 text-center font-black text-blue-700 tracking-tighter">{s.code}</td>
                  <td className="p-3 border-r-2 border-slate-900 text-left px-5 text-slate-900 font-black tracking-tight">{s.name}</td>
                  <td className="p-3 border-r-2 border-slate-900 text-center font-black text-slate-800">{s.abbreviation}</td>
                  <td className="p-3 text-left px-5 font-black text-slate-700">{fac?.name || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Modal Components ---

const EntityModal = ({ modal, onClose, onSave, facultyList, sections }: any) => {
    const [formData, setFormData] = useState<any>(modal.data);
    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
                <div className="px-10 py-8 border-b border-slate-100 flex justify-between bg-slate-50/80">
                    <h3 className="font-black uppercase text-slate-900 tracking-tight">Edit {modal.type} Record</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-10 space-y-5">
                    {modal.type === 'faculty' && (
                        <>
                            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</label><input className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-900 font-bold focus:border-blue-500 outline-none" placeholder="Prof. Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}/></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email ID</label><input className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-900 font-bold focus:border-blue-500 outline-none" placeholder="Email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})}/></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Dept Status</label><input className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-900 font-bold focus:border-blue-500 outline-none" placeholder="IT / H&S" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})}/></div>
                        </>
                    )}
                    {modal.type === 'subject' && (
                        <>
                            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Course Code</label><input className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-900 font-bold focus:border-blue-500 outline-none" placeholder="PC701IT" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})}/></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Subject Name</label><input className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-900 font-bold focus:border-blue-500 outline-none" placeholder="Subject Title" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}/></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Abbreviation</label><input className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-900 font-bold focus:border-blue-500 outline-none" placeholder="IOT" value={formData.abbreviation || ''} onChange={e => setFormData({...formData, abbreviation: e.target.value})}/></div>
                        </>
                    )}
                    {modal.type === 'room' && (
                        <>
                            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Room Name</label><input className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-900 font-bold focus:border-blue-500 outline-none" placeholder="N 305" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}/></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Capacity</label><input className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-900 font-bold focus:border-blue-500 outline-none" type="number" placeholder="60" value={formData.capacity || 0} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}/></div>
                        </>
                    )}
                    {modal.type === 'student' && (
                        <>
                            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Assign Section</label><select className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white font-bold" value={formData.sectionId || ''} onChange={e => setFormData({...formData, sectionId: e.target.value})}><option value="">Select...</option>{sections.map((s: any) => <option key={s.id} value={s.id}>Section {s.name}</option>)}</select></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Strength</label><input className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-900 font-bold focus:border-blue-500 outline-none" type="number" placeholder="60" value={formData.strength || 0} onChange={e => setFormData({...formData, strength: parseInt(e.target.value)})}/></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Roll Number Range</label><input className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-900 font-bold focus:border-blue-500 outline-none" placeholder="Range" value={formData.rollRange || ''} onChange={e => setFormData({...formData, rollRange: e.target.value})}/></div>
                        </>
                    )}
                </div>
                <div className="p-10 border-t border-slate-100 flex justify-end space-x-4 bg-slate-50/50">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 uppercase text-[11px] tracking-widest">Discard</button>
                    <button onClick={() => onSave(formData)} className="px-10 py-3.5 bg-blue-600 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const EditEntryModal = ({ editing, facultyList, subjectList, onClose, onSave, onRemove }: any) => {
    const [formData, setFormData] = useState<TimetableEntry>(editing.entry);
    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
                <div className="px-10 py-8 border-b border-slate-100 flex justify-between bg-slate-50/80">
                    <h3 className="font-black uppercase text-slate-900 tracking-tight">Edit Session: {editing.day}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-10 space-y-5">
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Subject</label><select className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white font-bold" value={formData.subjectId || ''} onChange={e => setFormData({...formData, subjectId: e.target.value})}><option value="">Select Course</option>{subjectList.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}</select></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Instructor</label><select className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white font-bold" value={formData.facultyId || ''} onChange={e => setFormData({...formData, facultyId: e.target.value})}><option value="">Select Faculty</option>{facultyList.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Lab Batch (If applicable)</label><input className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-900 font-bold focus:border-blue-500 outline-none" placeholder="B1, B2, B3 or ALL" value={formData.batch || ''} onChange={e => setFormData({...formData, batch: e.target.value})}/></div>
                </div>
                <div className="p-10 border-t border-slate-100 flex justify-between bg-slate-50/50">
                    <button onClick={() => onRemove(formData.id)} className="text-red-500 font-black uppercase text-[10px] tracking-widest px-4 hover:bg-red-50 rounded-xl transition-all">Clear Slot</button>
                    <div className="flex space-x-3">
                        <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Cancel</button>
                        <button onClick={() => onSave(formData)} className="px-8 py-3.5 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">Update</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AuditLogs = ({ logs }: { logs: ChangeLog[] }) => (
  <Card title="Activity log">
    <div className="space-y-4">
      {logs.map(log => (
        <div key={log.id} className="p-6 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0 uppercase">{log.user?.charAt(0)}</div>
          <div className="flex-1">
            <h5 className="font-black text-slate-900 text-sm uppercase tracking-tight">{log.description}</h5>
            <div className="mt-1 flex items-center space-x-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>{log.user}</span><span>•</span><span>{new Date(log.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const PublicTimetable = ({ state }: { state: AppState }) => {
  const [year, setYear] = useState(4);
  const [section, setSection] = useState('A');
  const filteredSection = state.sections.find(s => s.year === year && s.name === section);
  const filteredTimetable = state.timetable.filter(t => t.sectionId === filteredSection?.id);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-wrap gap-6 bg-slate-50 p-8 rounded-[40px] border border-slate-200">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Curriculum Year</label>
          <div className="flex gap-2">
            {[2, 3, 4].map(y => (
              <button key={y} onClick={() => setYear(y)} className={`px-8 py-3.5 rounded-2xl font-black transition-all text-xs uppercase tracking-widest ${year === y ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105' : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-300'}`}>Year {y}</button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Group</label>
          <div className="flex gap-2">
            {['A', 'B'].map(s => (
              <button key={s} onClick={() => setSection(s)} className={`px-8 py-3.5 rounded-2xl font-black transition-all text-xs uppercase tracking-widest ${section === s ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105' : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-300'}`}>Section {s}</button>
            ))}
          </div>
        </div>
      </div>
      {filteredSection && state.timetable.length > 0 ? (
        <div className="max-w-7xl mx-auto"><SectionTimetable section={filteredSection} timetable={filteredTimetable} subjects={state.subjects} rooms={state.rooms} faculty={state.faculty} onEditCell={() => {}} /></div>
      ) : (
        <div className="text-center py-40 bg-slate-50/30 rounded-[40px] border-4 border-dashed border-slate-200">
           <Calendar className="mx-auto text-slate-200 mb-8" size={100} />
           <h4 className="text-3xl font-black text-slate-400 uppercase tracking-tighter">Table Under Generation</h4>
           <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-4">The selected timetable is either empty or not yet published by the HoD.</p>
        </div>
      )}
    </div>
  );
};
