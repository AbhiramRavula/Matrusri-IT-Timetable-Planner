
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
  Download
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
  SubjectType
} from './types';
import { 
  INITIAL_FACULTY, 
  INITIAL_ROOMS, 
  INITIAL_SECTIONS, 
  INITIAL_SUBJECTS, 
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
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ title, children, extra }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
      <h3 className="font-semibold text-slate-800 uppercase tracking-wider text-sm">{title}</h3>
      {extra}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// --- Main App ---

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // App Data
  const [state, setState] = useState<AppState>({
    users: [],
    faculty: INITIAL_FACULTY,
    subjects: INITIAL_SUBJECTS,
    rooms: INITIAL_ROOMS,
    sections: INITIAL_SECTIONS,
    timetable: [],
    logs: [],
    isPublished: false,
  });

  const [aiResponse, setAiResponse] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Edit/CRUD States
  const [editingEntry, setEditingEntry] = useState<{
    entry: TimetableEntry;
    sectionId: string;
    day: string;
    period: number;
  } | null>(null);

  const [entityModal, setEntityModal] = useState<{
    type: 'faculty' | 'subject' | 'room';
    data: any;
  } | null>(null);

  // Load from storage
  useEffect(() => {
    const saved = localStorage.getItem('matrusri_timetable_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.timetable) {
          setState(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
  }, []);

  // Save to storage
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
    const prompt = `Analyze current IT department timetable. 
    Total Subjects: ${state.subjects.length}
    Total Rooms: ${state.rooms.length}
    Total Faculty: ${state.faculty.length}
    Allocated Slots: ${state.timetable.length}
    Provide 3 suggestions for improvement or potential conflicts.`;
    const res = await getGeminiAssistance(prompt);
    setAiResponse(res);
    setIsAiLoading(false);
  };

  const handleEditCell = (sectionId: string, day: string, period: number, existingEntry?: TimetableEntry) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    
    setEditingEntry({
      entry: existingEntry || {
        id: Math.random().toString(36).substr(2, 9),
        day,
        period,
        subjectId: '',
        facultyId: '',
        roomId: '',
        sectionId
      },
      sectionId,
      day,
      period
    });
  };

  const validateAndSaveEntry = (updatedEntry: TimetableEntry) => {
    // 1. Check Faculty Conflict
    const facultyConflict = state.timetable.find(t => 
      t.id !== updatedEntry.id && 
      t.facultyId === updatedEntry.facultyId && 
      t.day === updatedEntry.day && 
      t.period === updatedEntry.period
    );

    if (facultyConflict) {
      const fac = state.faculty.find(f => f.id === updatedEntry.facultyId);
      const sec = state.sections.find(s => s.id === facultyConflict.sectionId);
      alert(`Conflict: ${fac?.name} is already teaching Section ${sec?.name} at this time.`);
      return false;
    }

    // 2. Check Room Conflict
    const roomConflict = state.timetable.find(t => 
      t.id !== updatedEntry.id && 
      t.roomId === updatedEntry.roomId && 
      t.day === updatedEntry.day && 
      t.period === updatedEntry.period
    );

    if (roomConflict) {
      const room = state.rooms.find(r => r.id === updatedEntry.roomId);
      const sec = state.sections.find(s => s.id === roomConflict.sectionId);
      alert(`Conflict: Room ${room?.name} is already occupied by Section ${sec?.name} at this time.`);
      return false;
    }

    // Save
    setState(prev => {
      const existingIdx = prev.timetable.findIndex(t => t.id === updatedEntry.id);
      let newTimetable = [...prev.timetable];
      
      if (existingIdx >= 0) {
        newTimetable[existingIdx] = updatedEntry;
      } else {
        newTimetable.push(updatedEntry);
      }

      const desc = `Manually edited slot for Section ${state.sections.find(s => s.id === updatedEntry.sectionId)?.name}: ${updatedEntry.day} P${updatedEntry.period}`;
      
      return {
        ...prev,
        timetable: newTimetable,
        logs: [{
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          user: currentUser?.name || 'Admin',
          description: desc
        }, ...prev.logs]
      };
    });

    setEditingEntry(null);
    return true;
  };

  const removeEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      timetable: prev.timetable.filter(t => t.id !== id),
      logs: [{
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: currentUser?.name || 'Admin',
        description: 'Removed a timetable slot manually'
      }, ...prev.logs]
    }));
    setEditingEntry(null);
  };

  // --- Entity CRUD Helpers ---

  const logAction = (description: string) => {
    return {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Admin',
      description
    };
  };

  const saveFaculty = (f: Faculty) => {
    setState(prev => {
      const exists = prev.faculty.findIndex(item => item.id === f.id);
      const newList = [...prev.faculty];
      const isNew = exists === -1;
      if (!isNew) newList[exists] = f; else newList.push(f);
      
      const desc = isNew ? `Added new faculty: ${f.name}` : `Updated faculty details: ${f.name}`;
      
      return { 
        ...prev, 
        faculty: newList,
        logs: [logAction(desc), ...prev.logs]
      };
    });
    setEntityModal(null);
  };

  const deleteFaculty = (id: string) => {
    const f = state.faculty.find(item => item.id === id);
    if (confirm(`Are you sure you want to delete ${f?.name}? This will remove all their timetable assignments.`)) {
      setState(prev => ({ 
        ...prev, 
        faculty: prev.faculty.filter(f => f.id !== id),
        timetable: prev.timetable.filter(t => t.facultyId !== id),
        logs: [logAction(`Deleted faculty: ${f?.name}`), ...prev.logs]
      }));
    }
  };

  const saveSubject = (s: Subject) => {
    setState(prev => {
      const exists = prev.subjects.findIndex(item => item.id === s.id);
      const newList = [...prev.subjects];
      const isNew = exists === -1;
      if (!isNew) newList[exists] = s; else newList.push(s);
      
      const desc = isNew ? `Added new subject: ${s.name} (${s.code})` : `Updated subject: ${s.name}`;
      
      return { 
        ...prev, 
        subjects: newList,
        logs: [logAction(desc), ...prev.logs]
      };
    });
    setEntityModal(null);
  };

  const deleteSubject = (id: string) => {
    const s = state.subjects.find(item => item.id === id);
    if (confirm(`Are you sure you want to delete subject ${s?.code}? This will remove it from all timetables.`)) {
      setState(prev => ({ 
        ...prev, 
        subjects: prev.subjects.filter(item => item.id !== id),
        timetable: prev.timetable.filter(t => t.subjectId !== id),
        logs: [logAction(`Deleted subject: ${s?.code}`), ...prev.logs]
      }));
    }
  };

  const saveRoom = (r: Room) => {
    setState(prev => {
      const exists = prev.rooms.findIndex(item => item.id === r.id);
      const newList = [...prev.rooms];
      const isNew = exists === -1;
      if (!isNew) newList[exists] = r; else newList.push(r);
      
      const desc = isNew ? `Added new room: ${r.name}` : `Updated room: ${r.name}`;
      
      return { 
        ...prev, 
        rooms: newList,
        logs: [logAction(desc), ...prev.logs]
      };
    });
    setEntityModal(null);
  };

  const deleteRoom = (id: string) => {
    const r = state.rooms.find(item => item.id === id);
    if (confirm(`Are you sure you want to delete room ${r?.name}? Slots assigned to this room will be cleared.`)) {
      setState(prev => ({ 
        ...prev, 
        rooms: prev.rooms.filter(item => item.id !== id),
        timetable: prev.timetable.filter(t => t.roomId !== id),
        logs: [logAction(`Deleted room: ${r?.name}`), ...prev.logs]
      }));
    }
  };

  // --- Views ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
              <Calendar size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Matrusri Engineering College</h1>
          <p className="text-center text-slate-500 mb-8 font-medium">IT Department Timetable Planner</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => handleLogin(UserRole.ADMIN)}
              className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-between shadow-lg shadow-blue-100"
            >
              <span>Login as Admin (HoD)</span>
              <ChevronRight size={18} />
            </button>
            <button 
              onClick={() => handleLogin(UserRole.FACULTY)}
              className="w-full py-4 px-4 bg-white border border-slate-200 hover:border-blue-600 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-between"
            >
              <span>Login as Faculty</span>
              <ChevronRight size={18} />
            </button>
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-400 uppercase tracking-widest text-[10px] font-bold">Public Access</span></div>
            </div>
            <button 
              onClick={() => setActiveTab('public')}
              className="w-full py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all text-center"
            >
              View Student Timetables
            </button>
          </div>
        </div>
        
        {/* Public View */}
        {activeTab === 'public' && (
           <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <Calendar size={20} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">MEC IT Public Board</h2>
                  </div>
                  <button onClick={() => { setActiveTab('login'); setCurrentUser(null); }} className="text-blue-600 font-bold hover:underline">Return to Login</button>
                </div>
                <PublicTimetable state={state} />
              </div>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 shadow-sm z-40">
        <div className="p-6 flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Calendar size={20} />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">MEC IT</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          {currentUser.role === UserRole.ADMIN && (
            <>
              <div className="pt-4 pb-2 px-4"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration</span></div>
              <SidebarItem icon={Users} label="Faculty" active={activeTab === 'faculty'} onClick={() => setActiveTab('faculty')} />
              <SidebarItem icon={BookOpen} label="Subjects" active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} />
              <SidebarItem icon={DoorOpen} label="Rooms" active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
              <div className="pt-4 pb-2 px-4"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management</span></div>
              <SidebarItem icon={Calendar} label="Generate" active={activeTab === 'generate'} onClick={() => setActiveTab('generate')} />
              <SidebarItem icon={History} label="Audit Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
            </>
          )}
          {currentUser.role === UserRole.FACULTY && (
             <SidebarItem icon={Calendar} label="My Timetable" active={activeTab === 'my-timetable'} onClick={() => setActiveTab('my-timetable')} />
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <UserIcon size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase truncate tracking-tighter">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-10 bg-[#fbfcfd] min-h-screen">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 capitalize tracking-tight">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Matrusri Engineering College • IT Department</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center text-slate-600 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              Academic Session 2024-25
            </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === 'dashboard' && <Dashboard state={state} />}
          {activeTab === 'faculty' && (
            <FacultyList 
              faculty={state.faculty} 
              onEdit={(f: Faculty) => setEntityModal({ type: 'faculty', data: f })}
              onDelete={deleteFaculty}
              onAdd={() => setEntityModal({ type: 'faculty', data: { id: Math.random().toString(36).substr(2, 9), name: '', email: '', designation: 'Asst. Professor', department: 'IT', weeklyLoad: 0 } })}
            />
          )}
          {activeTab === 'subjects' && (
            <SubjectList 
              subjects={state.subjects} 
              facultyList={state.faculty}
              onEdit={(s: Subject) => setEntityModal({ type: 'subject', data: s })}
              onDelete={deleteSubject}
              onAdd={() => setEntityModal({ type: 'subject', data: { id: Math.random().toString(36).substr(2, 9), code: '', name: '', abbreviation: '', type: SubjectType.THEORY, year: 3, semester: 5, section: 'A', periodsPerWeek: 4, assignedFacultyId: '' } })}
            />
          )}
          {activeTab === 'rooms' && (
            <RoomList 
              rooms={state.rooms}
              onEdit={(r: Room) => setEntityModal({ type: 'room', data: r })}
              onDelete={deleteRoom}
              onAdd={() => setEntityModal({ type: 'room', data: { id: Math.random().toString(36).substr(2, 9), name: '', type: SubjectType.THEORY, capacity: 60 } })}
            />
          )}
          {activeTab === 'generate' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Scheduler Controls</h3>
                  <p className="text-slate-500 text-sm">Review and refine generated schedules</p>
                </div>
                <div className="flex space-x-3">
                   <button 
                    onClick={askGemini}
                    disabled={isAiLoading}
                    className="flex items-center space-x-2 px-5 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold transition-all disabled:opacity-50 border border-indigo-100"
                  >
                    <Zap size={18} className={isAiLoading ? "animate-pulse" : ""} />
                    <span>{isAiLoading ? "Processing..." : "AI Audit"}</span>
                  </button>
                  <button 
                    onClick={onGenerate}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all"
                  >
                    <Plus size={18} />
                    <span>Regenerate All</span>
                  </button>
                </div>
              </div>

              {aiResponse && (
                <div className="p-6 bg-indigo-600 rounded-2xl shadow-xl text-white animate-in slide-in-from-top duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <MessageSquareText size={20} />
                      <span className="font-bold">Gemini Scheduler Assistant</span>
                    </div>
                    <button onClick={() => setAiResponse("")} className="hover:opacity-70"><X size={18} /></button>
                  </div>
                  <div className="text-indigo-50 text-sm leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none">
                    {aiResponse}
                  </div>
                </div>
              )}

              {state.timetable.length > 0 ? (
                <div className="space-y-16">
                  {state.sections.map(section => (
                    <SectionTimetable 
                      key={section.id} 
                      section={section} 
                      timetable={state.timetable.filter(t => t.sectionId === section.id)}
                      subjects={state.subjects}
                      rooms={state.rooms}
                      faculty={state.faculty}
                      onEditCell={handleEditCell}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                  <Calendar className="mx-auto text-slate-200 mb-6" size={80} />
                  <h4 className="text-2xl font-bold text-slate-800 mb-2">Ready to Schedule</h4>
                  <p className="text-slate-500 max-w-sm mx-auto mb-8">Click generate to create an optimized, conflict-free timetable for the entire IT department.</p>
                  <button onClick={onGenerate} className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                    Generate Timetable
                  </button>
                </div>
              )}
            </div>
          )}
          {activeTab === 'logs' && <AuditLogs logs={state.logs} />}
          {activeTab === 'my-timetable' && (
            <FacultyTimetable 
              faculty={state.faculty.find(f => f.email === currentUser.email)!} 
              timetable={state.timetable.filter(t => t.facultyId === state.faculty.find(f => f.email === currentUser.email)?.id)}
              subjects={state.subjects}
              sections={state.sections}
              rooms={state.rooms}
            />
          )}
        </div>
      </main>

      {/* Timetable Edit Modal */}
      {editingEntry && (
        <EditEntryModal 
          editing={editingEntry}
          facultyList={state.faculty}
          roomList={state.rooms}
          subjectList={state.subjects.filter(s => {
            const sec = state.sections.find(sec => sec.id === editingEntry.sectionId);
            return s.year === sec?.year && s.semester === sec?.semester;
          })}
          onClose={() => setEditingEntry(null)}
          onSave={validateAndSaveEntry}
          onRemove={removeEntry}
        />
      )}

      {/* Entity CRUD Modal */}
      {entityModal && (
        <EntityModal 
          modal={entityModal}
          onClose={() => setEntityModal(null)}
          onSave={(data: any) => {
            if (entityModal.type === 'faculty') saveFaculty(data);
            if (entityModal.type === 'subject') saveSubject(data);
            if (entityModal.type === 'room') saveRoom(data);
          }}
          facultyList={state.faculty}
        />
      )}
    </div>
  );
}

// --- Specific View Components ---

const Dashboard = ({ state }: { state: AppState }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
    {[
      { label: 'Faculty', count: state.faculty.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Subjects', count: state.subjects.length, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Rooms', count: state.rooms.length, icon: DoorOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'Classes', count: state.sections.length, icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ].map((item, i) => (
      <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-6">
          <div className={`${item.bg} ${item.color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
            <item.icon size={28} />
          </div>
          <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500" />
        </div>
        <h4 className="text-4xl font-black text-slate-800 tracking-tight">{item.count}</h4>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">{item.label}</p>
      </div>
    ))}
    
    <div className="col-span-1 md:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 overflow-hidden">
      <h3 className="font-bold text-slate-800 mb-6 flex items-center text-sm uppercase tracking-widest"><History size={18} className="mr-3 text-blue-500" /> System Activity</h3>
      <div className="space-y-6">
        {state.logs.slice(0, 4).map(log => (
          <div key={log.id} className="flex items-start space-x-4">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0 shadow-sm shadow-blue-300" />
            <div>
              <p className="text-slate-700 font-bold text-sm leading-tight">{log.description}</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-tighter">{new Date(log.timestamp).toLocaleTimeString()} • {log.user}</p>
            </div>
          </div>
        ))}
        {state.logs.length === 0 && <p className="text-slate-400 italic text-sm text-center py-4">Logs will appear here once activity begins.</p>}
      </div>
    </div>

    <div className="col-span-1 md:col-span-2 bg-slate-900 rounded-3xl shadow-2xl p-10 text-white relative overflow-hidden flex flex-col justify-between group">
      <div className="absolute top-0 right-0 -m-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="relative z-10">
        <h3 className="text-3xl font-black mb-3">Conflict-Free Scheduling</h3>
        <p className="text-slate-400 text-sm max-w-xs leading-relaxed">Our heuristic engine automatically validates faculty availability, room capacity, and course requirements.</p>
      </div>
      <div className="mt-12 relative z-10">
        <div className="flex -space-x-3 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
              {String.fromCharCode(64 + i)}
            </div>
          ))}
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-blue-900/40">
          Open Planner
        </button>
      </div>
    </div>
  </div>
);

const SectionTimetable = ({ section, timetable, subjects, rooms, faculty, onEditCell }: any) => {
  const getEntry = (day: string, period: number) => {
    return timetable.find((t: any) => t.day === day && t.period === period);
  };

  const classTeacher = faculty.find((f: any) => f.id === section.classTeacherId);
  const sectionRoom = rooms.find((r: any) => r.id === section.defaultRoomId);

  // Grouped subjects for the legend table at the bottom
  const sectionSubjects = subjects.filter((s: any) => s.year === section.year && s.semester === section.semester);

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-slate-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Header matching the reference images */}
        <div className="px-6 py-4 border-b-2 border-slate-900 flex flex-wrap justify-between items-end gap-y-4">
          <div className="space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Class:</span>
              <span className="font-black text-slate-900 text-sm">B.E {section.semester === 7 ? 'VII' : section.semester === 5 ? 'V' : section.semester === 3 ? 'III' : 'I'} SEM - IT {section.name && `SEC-${section.name}`}</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Room No:</span>
              <span className="font-black text-slate-900 text-sm uppercase">{sectionRoom?.name || 'N/A'}</span>
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Date: {new Date().toLocaleDateString('en-GB')}</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-[10px] font-black uppercase text-slate-400">W. E. F:</span>
              <span className="font-black text-slate-900 text-sm">{section.wefDate || '22/09/2025'}</span>
            </div>
          </div>

          <div className="text-right">
             <div className="flex items-baseline space-x-2 justify-end">
              <span className="text-[10px] font-black uppercase text-slate-400">Class Teacher:</span>
              <span className="font-black text-slate-900 text-sm uppercase">{classTeacher?.name || 'Unassigned'}</span>
            </div>
            <button className="mt-2 inline-flex items-center px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest">
              <Download size={14} className="mr-2" /> Download
            </button>
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-bold border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="p-3 border-r-2 border-slate-900 text-slate-900 uppercase w-24 bg-slate-50">Time</th>
                {PERIODS.map((p, idx) => (
                  <th key={p} className={`p-2 border-r-2 last:border-r-0 border-slate-900 text-slate-900 bg-slate-50 ${p === LUNCH_PERIOD ? 'w-16' : ''}`}>
                    {p === LUNCH_PERIOD ? 'LUNCH' : PERIOD_TIMES[idx]}
                  </th>
                ))}
              </tr>
              <tr className="border-b-2 border-slate-900">
                <th className="p-3 border-r-2 border-slate-900 text-slate-900 uppercase bg-slate-50">Day</th>
                {PERIODS.map(p => (
                  <th key={p} className="p-2 border-r-2 last:border-r-0 border-slate-900 text-slate-400 bg-slate-50">
                    {p === LUNCH_PERIOD ? '' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day} className="border-b-2 last:border-b-0 border-slate-900">
                  <td className="p-3 border-r-2 border-slate-900 bg-slate-50 text-slate-900 font-black">{day}</td>
                  {PERIODS.map(p => {
                    if (p === LUNCH_PERIOD) {
                      return (
                        <td key={p} className="bg-slate-50 border-r-2 border-slate-900 text-center font-black text-slate-400 align-middle">
                          <div className="rotate-0 lg:rotate-0 flex flex-col items-center justify-center h-full">
                            <span>L</span><span>U</span><span>N</span><span>C</span><span>H</span>
                          </div>
                        </td>
                      );
                    }
                    const entry = getEntry(day, p);
                    const sub = subjects.find((s: any) => s.id === entry?.subjectId);

                    return (
                      <td 
                        key={p} 
                        onClick={() => onEditCell(section.id, day, p, entry)}
                        className={`p-3 border-r-2 last:border-r-0 border-slate-900 min-w-[120px] h-16 text-center cursor-pointer transition-all hover:bg-blue-50 relative group ${!entry ? 'bg-white' : 'bg-white'}`}
                      >
                        {!entry ? (
                           <Plus size={14} className="mx-auto text-slate-100 group-hover:text-blue-200" />
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-0.5">
                            <span className="text-slate-900 font-black text-sm">{sub?.abbreviation || sub?.code}</span>
                            {sub?.type === SubjectType.LAB && <span className="text-[9px] text-blue-600">(LAB)</span>}
                          </div>
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

      {/* Legend Table matching reference images */}
      <div className="bg-white border-2 border-slate-900 rounded-lg overflow-hidden">
        <table className="w-full text-[11px] font-bold">
          <thead className="bg-slate-50 border-b-2 border-slate-900">
            <tr>
              <th className="p-2 border-r-2 border-slate-900 w-12 text-center">S.NO</th>
              <th className="p-2 border-r-2 border-slate-900 w-24 text-center">SUB.CODE</th>
              <th className="p-2 border-r-2 border-slate-900 text-left px-4">SUBJECTNAME</th>
              <th className="p-2 border-r-2 border-slate-900 w-24 text-center">ABBREVIATION</th>
              <th className="p-2 text-left px-4">FACULTYNAME</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 border-slate-900">
            {sectionSubjects.map((s: any, idx: number) => {
              const fac = faculty.find((f: any) => f.id === s.assignedFacultyId);
              return (
                <tr key={s.id}>
                  <td className="p-2 border-r-2 border-slate-900 text-center">{idx + 1}</td>
                  <td className="p-2 border-r-2 border-slate-900 text-center uppercase">{s.code}</td>
                  <td className="p-2 border-r-2 border-slate-900 text-left px-4 uppercase">{s.name}</td>
                  <td className="p-2 border-r-2 border-slate-900 text-center uppercase">{s.abbreviation}</td>
                  <td className="p-2 text-left px-4 uppercase">{fac?.name || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EditEntryModal = ({ editing, facultyList, roomList, subjectList, onClose, onSave, onRemove }: any) => {
  const [formData, setFormData] = useState<TimetableEntry>(editing.entry);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div>
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Modify Slot</h3>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-0.5">
              {editing.day} • PERIOD {editing.period}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors bg-white border border-slate-100">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Subject</label>
            <select 
              className="w-full p-4 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:outline-none bg-white font-bold text-slate-700"
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            >
              <option value="">Select Subject</option>
              {subjectList.map((s: any) => (
                <option key={s.id} value={s.id}>{s.abbreviation} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teaching Faculty</label>
            <select 
              className="w-full p-4 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:outline-none bg-white font-bold text-slate-700"
              value={formData.facultyId}
              onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
            >
              <option value="">Select Faculty</option>
              {facultyList.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Allocation</label>
            <select 
              className="w-full p-4 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:outline-none bg-white font-bold text-slate-700"
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
            >
              <option value="">Select Room</option>
              {roomList.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start space-x-3">
            <AlertCircle size={20} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-blue-800 leading-normal font-bold uppercase tracking-tight">
              system will block save if instructor or room is busy in another session at this time.
            </p>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
          <button 
            onClick={() => onRemove(formData.id)}
            className="text-red-500 hover:text-red-600 font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl transition-all"
          >
            Clear
          </button>
          <div className="flex space-x-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSave(formData)}
              disabled={!formData.subjectId || !formData.facultyId || !formData.roomId}
              className="px-8 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              Save Slot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CRUD View Components ---

const FacultyList = ({ faculty, onEdit, onDelete, onAdd }: any) => (
  <Card 
    title="Faculty Directory" 
    extra={
      <button onClick={onAdd} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
        <Plus size={16} className="mr-2" /> Add Faculty
      </button>
    }
  >
    <div className="overflow-x-auto -mx-6">
      <table className="w-full">
        <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest text-left">
          <tr>
            <th className="px-8 py-5">Instructor Name</th>
            <th className="px-8 py-5">College Email</th>
            <th className="px-8 py-5">Designation</th>
            <th className="px-8 py-5">Load (P/W)</th>
            <th className="px-8 py-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-100">
          {faculty.map((f: Faculty) => (
            <tr key={f.id} className="hover:bg-slate-50/30 transition-colors group">
              <td className="px-8 py-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                    {f.name.charAt(0)}
                  </div>
                  <span className="font-black text-slate-800 uppercase tracking-tight">{f.name}</span>
                </div>
              </td>
              <td className="px-8 py-5 text-slate-500 font-bold lowercase">{f.email}</td>
              <td className="px-8 py-5">
                <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-blue-100">
                  {f.designation}
                </span>
              </td>
              <td className="px-8 py-5 text-slate-600 font-black">{f.weeklyLoad}</td>
              <td className="px-8 py-5 text-right">
                <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(f)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={18} /></button>
                  <button onClick={() => onDelete(f.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const SubjectList = ({ subjects, facultyList, onEdit, onDelete, onAdd }: any) => (
  <Card 
    title="Subject & Course Management"
    extra={
      <button onClick={onAdd} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
        <Plus size={16} className="mr-2" /> Add Subject
      </button>
    }
  >
    <div className="overflow-x-auto -mx-6">
      <table className="w-full">
        <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest text-left">
          <tr>
            <th className="px-8 py-5">Code</th>
            <th className="px-8 py-5">Subject Name</th>
            <th className="px-8 py-5">Type</th>
            <th className="px-8 py-5">Level</th>
            <th className="px-8 py-5">Periods</th>
            <th className="px-8 py-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-100">
          {subjects.map((s: Subject) => (
              <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-8 py-5 font-black text-blue-600 uppercase tracking-widest">{s.code}</td>
                <td className="px-8 py-5">
                   <div className="flex flex-col">
                    <span className="font-black text-slate-800 uppercase tracking-tight">{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.abbreviation}</span>
                   </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${s.type === 'Theory' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                    {s.type}
                  </span>
                </td>
                <td className="px-8 py-5 text-slate-500 font-bold text-xs uppercase">Y{s.year} • S{s.semester}</td>
                <td className="px-8 py-5 text-slate-600 font-black">{s.periodsPerWeek}</td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(s)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={18} /></button>
                    <button onClick={() => onDelete(s.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
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
  <Card 
    title="Facility Allocation"
    extra={
      <button onClick={onAdd} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
        <Plus size={16} className="mr-2" /> Add Room
      </button>
    }
  >
    <div className="overflow-x-auto -mx-6">
      <table className="w-full">
        <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest text-left">
          <tr>
            <th className="px-8 py-5">Room Identity</th>
            <th className="px-8 py-5">Capability</th>
            <th className="px-8 py-5">Capacity</th>
            <th className="px-8 py-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-100">
          {rooms.map((r: Room) => (
            <tr key={r.id} className="hover:bg-slate-50/30 transition-colors group">
              <td className="px-8 py-5 font-black text-slate-800 uppercase tracking-widest">{r.name}</td>
              <td className="px-8 py-5">
                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${r.type === 'Theory' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                  {r.type}
                </span>
              </td>
              <td className="px-8 py-5 text-slate-600 font-black tracking-widest">{r.capacity} <span className="text-[10px] text-slate-400">SEATS</span></td>
              <td className="px-8 py-5 text-right">
                <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(r)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={18} /></button>
                  <button onClick={() => onDelete(r.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const EntityModal = ({ modal, onClose, onSave, facultyList }: any) => {
  const [formData, setFormData] = useState<any>(modal.data);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-800 text-xl uppercase tracking-tight">
            {modal.data.name || modal.data.code ? 'Update' : 'New'} {modal.type}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors bg-white border border-slate-100 shadow-sm"><X size={18} /></button>
        </div>
        
        <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
          {modal.type === 'faculty' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity</label>
                <input 
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 bg-white font-black text-slate-800 outline-none transition-all" 
                  value={formData.name} 
                  placeholder="e.g. PROF. S. NAGAJYOTHI"
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                <input 
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 bg-white font-bold text-slate-600 outline-none transition-all" 
                  value={formData.email} 
                  placeholder="name@matrusri.edu.in"
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <select 
                    className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white font-black text-slate-700 outline-none" 
                    value={formData.designation} 
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  >
                    <option>Professor</option>
                    <option>Assoc. Professor</option>
                    <option>Asst. Professor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max P/W</label>
                  <input 
                    type="number"
                    className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 bg-white font-black text-slate-800 outline-none" 
                    value={formData.weeklyLoad} 
                    onChange={e => setFormData({ ...formData, weeklyLoad: parseInt(e.target.value) })} 
                  />
                </div>
              </div>
            </div>
          )}

          {modal.type === 'room' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Designation</label>
                <input 
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-800 uppercase outline-none focus:border-blue-500" 
                  value={formData.name} 
                  placeholder="e.g. N 313"
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Environment Type</label>
                <select 
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white font-black text-slate-700 outline-none" 
                  value={formData.type} 
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value={SubjectType.THEORY}>Lecture Hall (Theory)</option>
                  <option value={SubjectType.LAB}>Specialized Lab (Lab)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Occupancy</label>
                <input 
                  type="number" 
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:border-blue-500" 
                  value={formData.capacity} 
                  onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })} 
                />
              </div>
            </div>
          )}

          {modal.type === 'subject' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Code</label>
                  <input 
                    className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-blue-600 font-mono outline-none focus:border-blue-500" 
                    value={formData.code} 
                    placeholder="e.g. PC702IT"
                    onChange={e => setFormData({ ...formData, code: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Abbreviation</label>
                  <input 
                    className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:border-blue-500" 
                    value={formData.abbreviation} 
                    placeholder="e.g. BDA"
                    onChange={e => setFormData({ ...formData, abbreviation: e.target.value })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Course Title</label>
                <input 
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:border-blue-500" 
                  value={formData.name} 
                  placeholder="e.g. Big Data Analytics"
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Curriculum Year</label>
                  <select 
                    className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none" 
                    value={formData.year} 
                    onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  >
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sem Index</label>
                  <input 
                    type="number" 
                    className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none" 
                    value={formData.semester} 
                    onChange={e => setFormData({ ...formData, semester: parseInt(e.target.value) })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modality</label>
                  <select 
                    className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white font-black text-slate-700 outline-none" 
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value={SubjectType.THEORY}>Theory (Lecture)</option>
                    <option value={SubjectType.LAB}>Lab (Practical)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">P / Wk</label>
                  <input 
                    type="number" 
                    className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none" 
                    value={formData.periodsPerWeek} 
                    onChange={e => setFormData({ ...formData, periodsPerWeek: parseInt(e.target.value) })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Instructor</label>
                <select 
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white font-black text-slate-700 outline-none" 
                  value={formData.assignedFacultyId} 
                  onChange={e => setFormData({ ...formData, assignedFacultyId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {facultyList.map((f: Faculty) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-end space-x-4">
          <button onClick={onClose} className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white rounded-2xl transition-all">Discard</button>
          <button onClick={() => onSave(formData)} className="px-10 py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center active:scale-95">
            <Save size={16} className="mr-3" /> Commit Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const FacultyTimetable = ({ faculty, timetable, subjects, sections, rooms }: any) => {
  const getEntry = (day: string, period: number) => {
    return timetable.find((t: any) => t.day === day && t.period === period);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-slate-900">
         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">{faculty.name}</h3>
         <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Personal Academic Schedule</p>
      </div>
      <div className="bg-white border-2 border-slate-900 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-bold border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-900">
                <th className="p-4 border-r-2 border-slate-900 text-slate-900 uppercase w-24">Day</th>
                {PERIODS.map((p, idx) => (
                  <th key={p} className="p-4 border-r-2 last:border-r-0 border-slate-900 text-slate-900">
                    {p === LUNCH_PERIOD ? 'LUNCH' : PERIOD_TIMES[idx]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day} className="border-b-2 last:border-b-0 border-slate-900">
                  <td className="p-4 border-r-2 border-slate-900 bg-slate-50 text-slate-900 font-black">{day}</td>
                  {PERIODS.map(p => {
                    if (p === LUNCH_PERIOD) return <td key={p} className="bg-slate-50 border-r-2 border-slate-900"></td>;
                    const entry = getEntry(day, p);
                    if (!entry) return <td key={p} className="p-4 border-r-2 last:border-r-0 border-slate-900 bg-white/50"></td>;
                    
                    const sub = subjects.find((s: any) => s.id === entry.subjectId);
                    const section = sections.find((s: any) => s.id === entry.sectionId);
                    const room = rooms.find((r: any) => r.id === entry.roomId);

                    return (
                      <td key={p} className="p-4 border-r-2 last:border-r-0 border-slate-900 min-w-[140px] bg-blue-50/30">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <span className="font-black text-slate-900 text-sm">{sub?.abbreviation}</span>
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">SEM-{section?.semester} • {section?.name}</span>
                          <span className="text-[9px] text-slate-400 uppercase">{room?.name}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AuditLogs = ({ logs }: { logs: ChangeLog[] }) => (
  <Card title="Administrative Audit Trail">
    <div className="space-y-4">
      {logs.map(log => (
        <div key={log.id} className="p-6 border-2 border-slate-100 rounded-2xl hover:border-blue-100 transition-all flex items-start space-x-6 bg-white shadow-sm group">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-sm shrink-0 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            {log.user.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h5 className="font-black text-slate-800 text-base uppercase tracking-tight leading-tight">{log.description}</h5>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest shrink-0 ml-4">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Initiated by <span className="text-blue-600">{log.user}</span> • {new Date(log.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="text-center py-32 text-slate-200">
          <History size={64} className="mx-auto mb-4 opacity-10" />
          <p className="font-black uppercase tracking-widest text-xs">No Audit Entries Found</p>
        </div>
      )}
    </div>
  </Card>
);

const PublicTimetable = ({ state }: { state: AppState }) => {
  const [selectedYear, setSelectedYear] = useState(4);
  const [selectedSection, setSelectedSection] = useState('A');

  const filteredSection = state.sections.find(s => s.year === selectedYear && s.name === selectedSection);
  const filteredTimetable = state.timetable.filter(t => t.sectionId === filteredSection?.id);

  return (
    <div className="space-y-12 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-wrap gap-8 bg-slate-50 p-10 rounded-[40px] border border-slate-200 shadow-inner">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest ml-1">Study Year</label>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(y => (
              <button 
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-10 py-4 rounded-2xl font-black transition-all text-sm uppercase tracking-widest ${selectedYear === y ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105' : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-blue-200'}`}
              >
                Year {y}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest ml-1">Section Group</label>
          <div className="flex gap-3">
            {['A', 'B'].map(s => (
              <button 
                key={s}
                onClick={() => setSelectedSection(s)}
                className={`px-10 py-4 rounded-2xl font-black transition-all text-sm uppercase tracking-widest ${selectedSection === s ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105' : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-blue-200'}`}
              >
                Section {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredSection && state.timetable.length > 0 ? (
        <div className="max-w-6xl mx-auto">
          <SectionTimetable 
            section={filteredSection} 
            timetable={filteredTimetable}
            subjects={state.subjects}
            rooms={state.rooms}
            faculty={state.faculty}
            onEditCell={() => {}} // Disabled for public view
          />
        </div>
      ) : (
        <div className="text-center py-40 bg-slate-50/30 rounded-[40px] border-4 border-dashed border-slate-100">
           <Calendar className="mx-auto text-slate-100 mb-8" size={100} />
           <h4 className="text-3xl font-black text-slate-300 uppercase tracking-tighter">Schedule Unavailable</h4>
           <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-4">The selected timetable has not been published or data is missing.</p>
        </div>
      )}
    </div>
  );
};
