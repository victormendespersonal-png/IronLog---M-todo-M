
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppView, 
  WorkoutRoutine, 
  WorkoutLog, 
  ExerciseSession, 
  Exercise, 
  SetLog,
  User,
  AiRecommendation,
  Badge,
  UserBadge,
  UserGoal,
  UserLevel,
  MonthlyComparison,
  WorkoutPerformanceReport
} from './types';
import * as Storage from './services/storageService';
import * as AI from './services/geminiService';
import * as Gamification from './services/gamificationService';
import * as Analysis from './services/analysisService';
import * as NotificationService from './services/notificationService';
import * as PdfService from './services/pdfService';
import { Button, Card, Input, Badge as UIBadge, Avatar } from './components/UI';
import Timer from './components/Timer';
import { 
  IconDumbbell, IconHistory, IconPlus, IconTrend, 
  IconPlay, IconBack, IconCheck, IconSave, IconBrain, IconTrash,
  IconClock, IconMail, IconLock, IconLogOut,
  IconLayers, IconRepeat, IconScale, IconFileText, IconMuscle,
  IconMore, IconCalendar, IconEdit, IconCopy, IconDownload, IconUpload, IconSearch, IconFilter, IconSettings, IconClose,
  IconUser, IconTrophy, IconMedal, IconFlame, IconZap,
  IconRobot, IconTarget, IconRefresh, IconBell, IconGlobe, IconCalendarCheck, IconShare, IconPrinter, IconLightning, IconSparkles, IconPlusCircle, IconCamera
} from './components/Icons';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, CartesianGrid, Cell, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// --- Sub-Components ---

const ProgressView: React.FC<{ 
  logs: WorkoutLog[]; 
  onBack: () => void; 
  onAiClick: () => void; 
}> = ({ logs, onBack, onAiClick }) => {
  const [selectedProgressExercise, setSelectedProgressExercise] = useState<string>('');
  const [volumePeriod, setVolumePeriod] = useState<'WEEK' | 'MONTH'>('WEEK');
  
  // Weekly AI Report Data
  const weeklyStats = useMemo(() => {
     const now = new Date();
     const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
     const recentLogs = logs.filter(l => new Date(l.startTime) >= oneWeekAgo);
     return Analysis.getWeeklyReport(recentLogs);
  }, [logs]);

  // Volume Chart Data
  const volumeData = useMemo(() => {
      return Analysis.getVolumeHistory(logs, volumePeriod);
  }, [logs, volumePeriod]);

  // Muscle Radar Data
  const muscleData = useMemo(() => {
      return Analysis.getMuscleBalance(logs);
  }, [logs]);

  // Personal Records
  const personalRecords = useMemo(() => {
      return Analysis.getPersonalRecords(logs);
  }, [logs]);

  // Strength Evolution Data (Line Chart)
  const uniqueExercises = useMemo(() => {
    const names = new Set<string>();
    logs.forEach(l => l.exercises.forEach(e => names.add(e.exerciseName)));
    return Array.from(names).sort();
  }, [logs]);

  useEffect(() => {
      if (!selectedProgressExercise && uniqueExercises.length > 0) {
          setSelectedProgressExercise(uniqueExercises[0]);
      }
  }, [uniqueExercises, selectedProgressExercise]);

  const strengthData = useMemo(() => {
    if (!selectedProgressExercise) return [];
    const data: { date: string; weight: number }[] = [];
    [...logs].reverse().forEach(log => {
      const relevantEx = log.exercises.find(e => e.exerciseName === selectedProgressExercise);
      if (relevantEx) {
        const maxWeight = Math.max(...relevantEx.sets.filter(s => s.completed).map(s => s.weight), 0);
        if (maxWeight > 0) {
          data.push({
            date: new Date(log.startTime).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
            weight: maxWeight
          });
        }
      }
    });
    return data;
  }, [logs, selectedProgressExercise]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        <header className="flex items-center gap-4">
            <button onClick={onBack} className="text-zinc-400 hover:text-white"><IconBack /></button>
            <h1 className="text-xl font-display font-bold text-red-50">Estatísticas Avançadas</h1>
        </header>

        {/* Weekly Report Card */}
        <div className="grid grid-cols-3 gap-2 text-center">
            <Card className="!p-3 flex flex-col items-center justify-center bg-zinc-900/50">
                <IconCheck className="text-metodo-red mb-1" size={16} />
                <span className="block text-xl font-display font-bold text-white">{weeklyStats.workouts}</span>
                <span className="text-[9px] uppercase text-zinc-500 font-bold">Treinos (7d)</span>
            </Card>
            <Card className="!p-3 flex flex-col items-center justify-center bg-zinc-900/50">
                <IconGlobe className="text-metodo-gold mb-1" size={16} />
                <span className="block text-xl font-display font-bold text-white">{Math.round(weeklyStats.volume / 1000)}t</span>
                <span className="text-[9px] uppercase text-zinc-500 font-bold">Volume (7d)</span>
            </Card>
            <Card className="!p-3 flex flex-col items-center justify-center bg-zinc-900/50">
                <IconZap className="text-metodo-red mb-1" size={16} />
                <span className="block text-xl font-display font-bold text-white">{weeklyStats.muscles}</span>
                <span className="text-[9px] uppercase text-zinc-500 font-bold">Grupos (7d)</span>
            </Card>
        </div>

        {/* 1. Volume Evolution (Area Chart) */}
        <Card className="min-h-[300px] border-zinc-800 relative overflow-hidden">
           <div className="flex justify-between items-center mb-6 z-10 relative">
               <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2 tracking-widest">
                  <IconTrend size={14} className="text-metodo-gold"/> Evolução de Volume (Ton)
               </h3>
               <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                   <button 
                    onClick={() => setVolumePeriod('WEEK')} 
                    className={`px-3 py-1 text-[10px] font-bold rounded uppercase transition-colors ${volumePeriod === 'WEEK' ? 'bg-metodo-red text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                   >Sem</button>
                   <button 
                    onClick={() => setVolumePeriod('MONTH')} 
                    className={`px-3 py-1 text-[10px] font-bold rounded uppercase transition-colors ${volumePeriod === 'MONTH' ? 'bg-metodo-red text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                   >Mês</button>
               </div>
           </div>
           <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#450a0a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#450a0a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid #450a0a', borderRadius: '8px', color: '#fff' }} 
                      itemStyle={{ color: '#d4af37' }}
                      formatter={(value: number) => [`${value} Ton`, 'Volume']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#d4af37" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2} />
                  <XAxis dataKey="name" hide />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </Card>

        {/* 2. Personal Records Grid */}
        <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                <IconTrophy size={14} /> Melhores Marcas (PRs)
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {personalRecords.map((rec, i) => (
                    <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
                        <div className="bg-metodo-gold/10 text-metodo-gold p-2 rounded-lg">
                            <IconMedal size={16} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold truncate">{rec.name}</p>
                            <p className="text-lg font-display font-bold text-white">{rec.weight}<span className="text-xs font-sans font-normal text-zinc-500">kg</span></p>
                        </div>
                    </div>
                ))}
                {personalRecords.length === 0 && (
                     <div className="col-span-2 text-center text-xs text-zinc-600 py-4 italic">Treine mais para desbloquear seus recordes.</div>
                )}
            </div>
        </div>

        {/* 3. Strength Progress (Line Chart) */}
        <Card className="min-h-[300px] border-zinc-800">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2 tracking-widest">
                  <IconScale size={14} className="text-metodo-gold"/> Progresso de Carga
              </h3>
              <select 
                  className="bg-black border border-zinc-800 text-xs rounded-lg p-2 text-red-500 max-w-[120px] focus:outline-none focus:border-metodo-red"
                  value={selectedProgressExercise}
                  onChange={(e) => setSelectedProgressExercise(e.target.value)}
              >
                  {uniqueExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
          </div>
          <div className="h-48 w-full">
              {strengthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={strengthData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="date" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} dy={10} />
                          <Tooltip 
                              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #450a0a', borderRadius: '8px', color: '#fff' }} 
                              itemStyle={{ color: '#d4af37' }}
                              labelStyle={{ color: '#a1a1aa', marginBottom: '0.5rem' }}
                          />
                          <Line 
                              type="step" 
                              dataKey="weight" 
                              stroke="#ef4444" 
                              strokeWidth={2} 
                              dot={{fill: '#000', stroke: '#ef4444', strokeWidth: 2, r: 3}} 
                              activeDot={{r: 5, fill: '#ef4444', stroke: '#fff'}} 
                          />
                      </LineChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
                      Sem dados suficientes.
                  </div>
              )}
          </div>
        </Card>

        {/* 4. Muscle Balance (Radar Chart) */}
        {muscleData.length >= 3 && (
            <Card className="min-h-[350px] border-zinc-800 flex flex-col items-center">
                <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2 tracking-widest w-full mb-2">
                    <IconMuscle size={14} className="text-metodo-gold"/> Balanço Muscular
                </h3>
                <div className="h-64 w-full relative -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={muscleData}>
                            <PolarGrid stroke="#27272a" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                            <Radar
                                name="Volume de Sets"
                                dataKey="A"
                                stroke="#d4af37"
                                strokeWidth={2}
                                fill="#d4af37"
                                fillOpacity={0.3}
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #d4af37', borderRadius: '8px', color: '#fff' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-zinc-500 text-center w-full">Distribuição de séries por grupo muscular</p>
            </Card>
        )}

        <Button variant="secondary" onClick={onAiClick} className="w-full py-4 mt-4">
            <IconBrain size={18} /> Análise Detalhada via IA
        </Button>
    </div>
  );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  
  // Auth Form State (Simplified)
  const [authName, setAuthName] = useState('');
  const [authPhoto, setAuthPhoto] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Workout State
  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine | null>(null);
  const [currentSession, setCurrentSession] = useState<WorkoutLog | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  const [editingNotesExerciseId, setEditingNotesExerciseId] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<Record<string, AiRecommendation>>({});
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutPerformanceReport | null>(null);
  const [isAddingExercise, setIsAddingExercise] = useState(false); // Dynamic exercise addition

  // History Detail & Filter State
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterMuscle, setHistoryFilterMuscle] = useState('');

  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiMonthlyReport, setAiMonthlyReport] = useState<string>('');
  const [monthlyStats, setMonthlyStats] = useState<MonthlyComparison | null>(null);
  const [analysisTab, setAnalysisTab] = useState<'GENERAL' | 'MONTHLY'>('GENERAL');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [unlockedBadgesQueue, setUnlockedBadgesQueue] = useState<Badge[]>([]);

  // AI Planner State
  const [planGoal, setPlanGoal] = useState<UserGoal>('HYPERTROPHY');
  const [planLevel, setPlanLevel] = useState<UserLevel>('INTERMEDIATE');
  const [planDays, setPlanDays] = useState<number>(4);
  const [generatedPlan, setGeneratedPlan] = useState<Partial<WorkoutRoutine>[] | null>(null);

  // Routine Management State
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineMuscles, setNewRoutineMuscles] = useState('');
  const [newExercises, setNewExercises] = useState<Exercise[]>([]);
  const [activeMenuRoutineId, setActiveMenuRoutineId] = useState<string | null>(null); // For "3 dots" menu
  
  // Temp Exercise State (for form & dynamic add)
  const [tempExName, setTempExName] = useState('');
  const [tempExMuscle, setTempExMuscle] = useState('');
  const [tempExSets, setTempExSets] = useState<number>(3);
  const [tempExReps, setTempExReps] = useState('');
  const [tempExWeight, setTempExWeight] = useState<number | undefined>(undefined);
  const [tempExRest, setTempExRest] = useState<number>(60);
  const [tempExNotes, setTempExNotes] = useState('');

  // Notification Interval
  useEffect(() => {
    if (user && logs.length > 0) {
        // Run check on mount
        NotificationService.checkForNotification(user, logs);

        // Check every 15 minutes
        const interval = setInterval(() => {
            NotificationService.checkForNotification(user, logs);
        }, 15 * 60 * 1000);

        return () => clearInterval(interval);
    }
  }, [user, logs]);

  // Load Session
  useEffect(() => {
    const sessionUser = Storage.getSession();
    if (sessionUser) {
      setUser(sessionUser);
      loadUserData(sessionUser.id);
      setView(AppView.DASHBOARD);
    } else {
      setView(AppView.AUTH);
    }
  }, []);

  const loadUserData = (userId: string) => {
      Storage.seedInitialData(userId);
      setRoutines(Storage.getRoutines(userId));
      setLogs(Storage.getWorkoutLogs(userId));
      setUserBadges(Storage.getUserBadges(userId));
  };

  // --- Auth Actions ---

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setAuthPhoto(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleEnter = () => {
      if (!authName.trim()) {
          setAuthError('Por favor, digite seu nome.');
          return;
      }
      
      const newUser: User = {
          id: Date.now().toString(),
          name: authName,
          photo: authPhoto,
          email: '', // Not used in public mode
          preferences: { enabled: true }
      };
      
      Storage.saveUser(newUser);
      Storage.saveSession(newUser);
      setUser(newUser);
      loadUserData(newUser.id);
      setAuthError('');
      setView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    Storage.clearSession();
    setUser(null);
    setAuthName('');
    setAuthPhoto('');
    setView(AppView.AUTH);
  };

  // --- Helpers ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // --- Workout Actions ---

  const startWorkout = (routine: WorkoutRoutine) => {
    if (!user) return;
    setActiveRoutine(routine);
    
    // Generate AI Recommendations
    const recs = Analysis.generateRecommendations(routine, logs);
    setAiRecommendations(recs);

    // Initialize empty session
    const newSession: WorkoutLog = {
      id: Date.now().toString(),
      userId: user.id,
      routineId: routine.id,
      routineName: routine.name,
      startTime: Date.now(),
      endTime: null,
      exercises: routine.exercises.map(ex => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        targetMuscle: ex.targetMuscle, // Capture muscle group
        notes: ex.notes, // Copy default notes
        sets: Array.from({ length: ex.defaultSets }).map((_, i) => ({
          id: `${ex.id}_s${i}`,
          reps: 0,
          weight: recs[ex.id]?.suggestedWeight || ex.defaultWeight || 0, // Pre-fill with suggestion
          completed: false,
          restTimeSeconds: 0
        }))
      }))
    };
    
    setCurrentSession(newSession);
    setView(AppView.ACTIVE_WORKOUT);
  };

  const startQuickWorkout = () => {
      if (!user) return;
      setActiveRoutine(null);
      
      const newSession: WorkoutLog = {
          id: Date.now().toString(),
          userId: user.id,
          routineName: "Treino Livre",
          startTime: Date.now(),
          endTime: null,
          exercises: []
      };
      
      setCurrentSession(newSession);
      setView(AppView.ACTIVE_WORKOUT);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof SetLog, value: any) => {
    if (!currentSession) return;
    
    const updatedExercises = [...currentSession.exercises];
    const currentSet = updatedExercises[exerciseIndex].sets[setIndex];
    
    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...currentSet,
      [field]: value
    };

    // If marking as completed, trigger timer with specific duration for this exercise
    if (field === 'completed' && value === true) {
      const exerciseId = currentSession.exercises[exerciseIndex].exerciseId;
      const routineExercise = activeRoutine?.exercises.find(e => e.id === exerciseId);
      
      // Check for AI stagnation recommendation for rest
      const aiRec = aiRecommendations[exerciseId];
      const restTime = aiRec?.suggestedRest || routineExercise?.defaultRestSeconds || 60;
      
      setTimerDuration(restTime);
      setShowTimer(true);
    }

    setCurrentSession({ ...currentSession, exercises: updatedExercises });
  };

  const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
      if (!currentSession) return;
      const updatedExercises = [...currentSession.exercises];
      updatedExercises[exerciseIndex].notes = notes;
      setCurrentSession({ ...currentSession, exercises: updatedExercises });
  };

  const handleAddDynamicExercise = () => {
      if (!currentSession || !tempExName) return;

      const newExId = `dyn_${Date.now()}`;
      const newSessionEx: ExerciseSession = {
          exerciseId: newExId,
          exerciseName: tempExName,
          targetMuscle: tempExMuscle || 'Geral',
          notes: tempExNotes,
          sets: Array.from({ length: tempExSets }).map((_, i) => ({
              id: `${newExId}_s${i}`,
              reps: 0,
              weight: tempExWeight || 0,
              completed: false,
              restTimeSeconds: 0
          }))
      };

      setCurrentSession({
          ...currentSession,
          exercises: [...currentSession.exercises, newSessionEx]
      });

      // Reset form
      setTempExName('');
      setTempExMuscle('');
      setTempExSets(3);
      setTempExWeight(undefined);
      setTempExNotes('');
      setIsAddingExercise(false);
  };

  const finishWorkout = () => {
    if (!currentSession || !user) return;
    
    // Calculate totals
    const totalDuration = Math.round((Date.now() - currentSession.startTime) / 60000);
    const totalVolume = currentSession.exercises.reduce((acc, ex) => 
       acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0)
    , 0);

    const completedLog = { ...currentSession, endTime: Date.now(), totalDuration, totalVolume };
    
    // Calculate AI Comparison Report BEFORE saving (to exclude current from "history" in comparison logic if needed, 
    // though analysis service handles it)
    const comparisonReport = Analysis.compareWorkoutPerformance(completedLog, logs);
    setWorkoutSummary(comparisonReport);

    Storage.saveWorkoutLog(completedLog);
    
    const updatedLogs = Storage.getWorkoutLogs(user.id);
    setLogs(updatedLogs);

    // Gamification Check
    const { unlocked, userBadges: updatedBadges } = Gamification.checkAchievements(user, updatedLogs);
    setUserBadges(updatedBadges);
    if (unlocked.length > 0) {
        setUnlockedBadgesQueue(unlocked); // Queue for display
    }

    setActiveRoutine(null);
    setCurrentSession(null);
    setShowTimer(false);
    
    // Redirect to Summary instead of Dashboard
    setView(AppView.WORKOUT_SUMMARY);
  };

  // --- Routine Management ---

  const prepareCreateRoutine = (routine?: WorkoutRoutine) => {
      if (routine) {
          setEditingRoutineId(routine.id);
          setNewRoutineName(routine.name);
          setNewRoutineMuscles(routine.targetMuscles.join(', '));
          setNewExercises([...routine.exercises]);
      } else {
          setEditingRoutineId(null);
          setNewRoutineName('');
          setNewRoutineMuscles('');
          setNewExercises([]);
      }
      setView(AppView.CREATE_ROUTINE);
      setActiveMenuRoutineId(null);
  };

  const handleCreateOrUpdateRoutine = () => {
    if (!user) return;
    const newRoutine: WorkoutRoutine = {
      id: editingRoutineId || Date.now().toString(),
      userId: user.id,
      name: newRoutineName,
      targetMuscles: newRoutineMuscles.split(',').map(s => s.trim()),
      exercises: newExercises
    };

    let updatedRoutines;
    if (editingRoutineId) {
        updatedRoutines = routines.map(r => r.id === editingRoutineId ? newRoutine : r);
    } else {
        updatedRoutines = [...routines, newRoutine];
    }

    Storage.saveRoutines(updatedRoutines);
    setRoutines(Storage.getRoutines(user.id)); // Re-fetch to ensure sync
    
    // Reset form
    setEditingRoutineId(null);
    setNewRoutineName('');
    setNewRoutineMuscles('');
    setNewExercises([]);
    setView(AppView.DASHBOARD);
  };

  const duplicateRoutine = (routine: WorkoutRoutine) => {
      if (!user) return;
      const copy: WorkoutRoutine = {
          ...routine,
          id: Date.now().toString(),
          userId: user.id,
          name: `${routine.name} (Cópia)`
      };
      const updated = [...routines, copy];
      Storage.saveRoutines(updated);
      setRoutines(updated);
      setActiveMenuRoutineId(null);
  };

  const deleteRoutine = (id: string) => {
      if (!confirm("Tem certeza que deseja excluir esta ficha?")) return;
      Storage.removeRoutine(id); // Use the new storage function
      const updated = Storage.getRoutines(user?.id); // Refresh from storage
      setRoutines(updated);
      setActiveMenuRoutineId(null);
  };

  const addExerciseToRoutine = () => {
    if (!tempExName) return;
    const ex: Exercise = {
      id: Date.now().toString(),
      name: tempExName,
      targetMuscle: tempExMuscle || 'Geral',
      defaultSets: tempExSets,
      defaultReps: tempExReps || '8-12',
      defaultWeight: tempExWeight,
      defaultRestSeconds: tempExRest,
      notes: tempExNotes
    };
    setNewExercises([...newExercises, ex]);
    
    // Reset temp fields but keep reasonable defaults
    setTempExName('');
    setTempExMuscle('');
    setTempExSets(3);
    setTempExReps('');
    setTempExWeight(undefined);
    setTempExNotes('');
  };

  const runAiAnalysis = async () => {
    setIsLoadingAi(true);
    const result = await AI.analyzeProgress(logs);
    setAiAnalysis(result);
    setIsLoadingAi(false);
  };

  const runMonthlyAnalysis = async () => {
      setIsLoadingAi(true);
      const stats = Analysis.getMonthlyComparison(logs);
      setMonthlyStats(stats);
      const report = await AI.generateMonthlyReport(stats);
      setAiMonthlyReport(report);
      setIsLoadingAi(false);
  };

  // --- AI Planner Logic ---

  const handleGeneratePlan = async () => {
      if (!user) return;
      setIsLoadingAi(true);
      setGeneratedPlan(null);
      try {
          const plan = await AI.generateWeeklyPlan(planGoal, planLevel, planDays, logs);
          setGeneratedPlan(plan);
      } catch (e) {
          alert('Erro ao gerar plano. Tente novamente.');
      } finally {
          setIsLoadingAi(false);
      }
  };

  const saveGeneratedPlan = (replace: boolean) => {
      if (!user || !generatedPlan) return;
      
      // Convert partial routines to full routines with IDs
      const newRoutines: WorkoutRoutine[] = generatedPlan.map((r, i) => ({
          id: `ai_plan_${Date.now()}_${i}`,
          userId: user.id,
          name: r.name || `Treino ${i + 1}`,
          targetMuscles: r.targetMuscles || [],
          exercises: (r.exercises || []).map((e, j) => ({
              ...e,
              id: `ai_ex_${Date.now()}_${i}_${j}`,
              targetMuscle: e.targetMuscle || 'Geral',
              defaultSets: e.defaultSets || 3,
              defaultReps: e.defaultReps || '8-12',
              defaultRestSeconds: e.defaultRestSeconds || 60
          })) as Exercise[]
      }));

      const finalRoutines = replace ? newRoutines : [...routines, ...newRoutines];
      Storage.saveRoutines(finalRoutines);
      setRoutines(Storage.getRoutines(user.id));
      setGeneratedPlan(null);
      setView(AppView.DASHBOARD);
      alert('Nova semana de treinos salva com sucesso!');
  };

  // --- Data Management ---
  const handleExportData = () => {
      if (!user) return;
      const data = Storage.getFullBackup(user.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ironlog_backup_${user.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              Storage.restoreBackup(data);
              loadUserData(user.id);
              alert('Dados importados com sucesso!');
          } catch (err) {
              alert('Erro ao importar arquivo. Formato inválido.');
          }
      };
      reader.readAsText(file);
  };

  // --- PDF Export Handlers ---
  const handleExportRoutinePdf = (routine: WorkoutRoutine) => {
      if (!user) return;
      PdfService.exportRoutineToPdf(routine, user);
      setActiveMenuRoutineId(null);
  };

  const handleExportLogPdf = (log: WorkoutLog) => {
      if (!user) return;
      PdfService.exportLogToPdf(log, user);
  };

  const handleExportHistoryPdf = () => {
      if (!user || logs.length === 0) return;
      PdfService.exportHistoryToPdf(logs, user);
  };

  // --- Settings Logic ---
  const toggleNotifications = async () => {
    if (!user) return;
    
    const newStatus = !user.preferences?.enabled;
    if (newStatus) {
        const granted = await NotificationService.requestPermission();
        if (!granted) {
            alert("Permissão de notificação negada pelo navegador.");
            return;
        }
    }
    
    const updatedUser = { ...user, preferences: { ...user.preferences, enabled: newStatus } };
    setUser(updatedUser);
    Storage.saveUser(updatedUser);
    Storage.saveSession(updatedUser);
  };

  // --- Views ---

  const renderAuth = () => (
    <div className="flex flex-col items-center justify-center min-h-[800px] px-6 animate-fade-in relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-metodo-red/10 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-metodo-gold/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="mb-12 text-center">
        <div className="relative inline-block mb-8">
          <div className="w-28 h-28 bg-gradient-to-br from-zinc-900 to-black rounded-full flex items-center justify-center border border-red-900/40 shadow-[0_0_40px_rgba(212,175,55,0.1)] relative z-10">
            <IconDumbbell size={48} className="text-metodo-red" />
          </div>
          <div className="absolute top-0 left-0 w-28 h-28 rounded-full border border-metodo-red/20 animate-ping opacity-20"></div>
        </div>
        <h1 className="text-5xl font-display font-bold text-white tracking-tighter">IRON<span className="text-metodo-red">LOG</span></h1>
        <p className="text-red-200/50 text-sm tracking-[0.4em] mt-2 font-display uppercase">Método M // Protocol</p>
      </div>

      <Card className="w-full max-w-sm space-y-8 !bg-zinc-950/90 !backdrop-blur-xl !border-zinc-800 flex flex-col items-center pt-10 pb-10">
        
        {/* Photo Upload Circle */}
        <div className="relative group cursor-pointer">
            <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="photo-upload"
                onChange={handlePhotoUpload}
            />
            <label htmlFor="photo-upload" className="block cursor-pointer">
                <div className={`w-32 h-32 rounded-full border-4 border-zinc-800 flex items-center justify-center overflow-hidden relative ${authPhoto ? 'bg-black' : 'bg-zinc-900'}`}>
                    {authPhoto ? (
                        <img src={authPhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <IconCamera size={40} className="text-zinc-600 group-hover:text-metodo-gold transition-colors" />
                    )}
                    
                    {/* Overlay hint */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconPlus size={24} className="text-white" />
                    </div>
                </div>
            </label>
             <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center mt-3 font-bold">
                {authPhoto ? 'Alterar Foto' : 'Adicionar Foto'}
            </p>
        </div>

        <div className="w-full space-y-4 px-4">
             {authError && (
                <div className="text-red-500 text-xs text-center font-bold">{authError}</div>
             )}
            <div className="relative">
                <IconUser className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={18} />
                <Input 
                    placeholder="Seu Nome de Atleta" 
                    className="pl-12 text-center" 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                />
            </div>
        </div>

        <Button onClick={handleEnter} className="w-full max-w-[200px] !py-4 text-sm tracking-widest shadow-xl shadow-metodo-red/20">
           Entrar
        </Button>
      </Card>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-10 animate-fade-in pb-10">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <Avatar src={user?.photo} alt={user?.name || 'User'} />
            <div>
                <p className="text-red-200 text-xs tracking-widest font-display uppercase">{getGreeting()},</p>
                <h1 className="text-2xl font-display font-bold text-white tracking-tight mt-0.5">{user?.name} 👊</h1>
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setView(AppView.SETTINGS)} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-metodo-gold hover:border-metodo-gold/30 transition-all">
                <IconSettings size={18} />
            </button>
            <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-900/30 transition-all">
                <IconLogOut size={18} />
            </button>
        </div>
      </header>
      
      {/* Badge Notification Modal (Simple overlay) */}
      {unlockedBadgesQueue.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-zinc-900 border-2 border-metodo-gold rounded-2xl p-8 text-center max-w-sm w-full shadow-[0_0_50px_rgba(212,175,55,0.3)] animate-slide-up">
                  <div className="w-20 h-20 bg-metodo-gold/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <IconTrophy size={40} className="text-metodo-gold" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">Conquista Desbloqueada!</h2>
                  <h3 className="text-xl font-bold text-metodo-gold mb-2">{unlockedBadgesQueue[0].name}</h3>
                  <p className="text-zinc-400 text-sm mb-6">{unlockedBadgesQueue[0].description}</p>
                  <Button onClick={() => setUnlockedBadgesQueue(prev => prev.slice(1))}>
                      Continuar
                  </Button>
              </div>
          </div>
      )}

      {/* Main Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* BIG START BUTTON */}
        <button 
            onClick={() => setView(AppView.SELECT_ROUTINE)}
            className="col-span-2 bg-gradient-to-br from-metodo-red to-red-900 p-8 rounded-2xl shadow-lg shadow-red-900/20 flex flex-col items-center justify-center gap-3 group hover:scale-[1.01] transition-transform relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
            <div className="p-4 bg-black/20 rounded-full text-white mb-1 backdrop-blur-sm border border-white/10">
                <IconPlay size={32} fill="currentColor" />
            </div>
            <span className="font-display font-bold text-white text-xl uppercase tracking-widest">Iniciar Treino</span>
        </button>

        {/* QUICK MODE */}
        <button 
            onClick={startQuickWorkout}
            className="col-span-2 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-row items-center justify-between gap-4 hover:border-metodo-gold/50 transition-all group"
        >
            <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-800 rounded-lg text-metodo-gold group-hover:bg-metodo-gold group-hover:text-black transition-colors">
                    <IconLightning size={24} />
                </div>
                <div className="text-left">
                    <span className="block font-display font-bold text-white text-sm uppercase tracking-wider">Treino Rápido</span>
                    <span className="block text-[10px] text-zinc-500">Sem ficha, adicionar na hora</span>
                </div>
            </div>
            <IconPlusCircle size={20} className="text-zinc-600 group-hover:text-metodo-gold" />
        </button>
        
        {/* AI Planner Button */}
        <button 
            onClick={() => setView(AppView.AI_PLANNER)}
            className="col-span-2 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-row items-center justify-between gap-4 hover:border-metodo-gold/50 transition-all group"
        >
            <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-800 rounded-lg text-metodo-gold group-hover:bg-metodo-gold group-hover:text-black transition-colors">
                    <IconRobot size={24} />
                </div>
                <div className="text-left">
                    <span className="block font-display font-bold text-white text-sm uppercase tracking-wider">Planejador IA</span>
                    <span className="block text-[10px] text-zinc-500">Montar nova semana de treinos</span>
                </div>
            </div>
            <IconTarget size={16} className="text-zinc-600 group-hover:text-metodo-gold" />
        </button>

        <button 
            onClick={() => setView(AppView.ACHIEVEMENTS)}
            className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-zinc-800 hover:border-zinc-700 transition-all aspect-square group"
        >
             <div className="p-3 bg-zinc-800 rounded-full text-zinc-400 group-hover:text-metodo-gold transition-colors">
                <IconTrophy size={24} />
             </div>
            <span className="font-display font-bold text-red-50 text-xs uppercase text-center tracking-wider">Conquistas</span>
        </button>

        <button 
            onClick={() => setView(AppView.HISTORY)}
            className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-zinc-800 hover:border-zinc-700 transition-all aspect-square group"
        >
             <div className="p-3 bg-zinc-800 rounded-full text-zinc-400 group-hover:text-metodo-gold transition-colors">
                <IconHistory size={24} />
             </div>
            <span className="font-display font-bold text-red-50 text-xs uppercase text-center tracking-wider">Histórico</span>
        </button>

        <button 
            onClick={() => setView(AppView.PROGRESS)}
            className="col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-row items-center justify-center gap-4 hover:bg-zinc-800 hover:border-zinc-700 transition-all"
        >
            <div className="p-2 bg-zinc-800 rounded-lg text-metodo-gold">
                <IconTrend size={20} />
            </div>
            <span className="font-display font-bold text-red-50 text-sm uppercase tracking-wider">Meu Progresso</span>
        </button>
      </div>

      {/* Last Workout Indicator */}
      <div className="pt-2">
        <h2 className="text-[10px] font-bold text-red-200/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <IconCheck size={12} /> Último Treino
        </h2>
        {logs.length > 0 ? (
            <Card className="!p-5 bg-gradient-to-r from-zinc-900 to-black border-l-4 border-l-metodo-red group cursor-pointer hover:border-metodo-gold transition-colors">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-display font-bold text-white text-lg">{logs[0].routineName}</h3>
                        <p className="text-zinc-500 text-xs mt-2 flex items-center gap-2">
                           <IconCalendar size={12} /> {new Date(logs[0].startTime).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <div className="text-right bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                         <span className="text-metodo-gold font-mono font-bold text-xl block">{logs[0].exercises.reduce((acc, ex) => acc + ex.sets.filter(s=>s.completed).length, 0)}</span>
                         <span className="text-[9px] block text-zinc-600 uppercase font-bold tracking-wider">Séries</span>
                    </div>
                </div>
            </Card>
        ) : (
            <div className="text-zinc-600 text-sm italic py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
                Nenhum treino registrado ainda.
            </div>
        )}
      </div>
    </div>
  );

  const renderAchievements = () => {
    // Merge Definitions with User Progress
    const displayBadges = Gamification.BADGES.map(def => {
        const userBadge = userBadges.find(ub => ub.badgeId === def.id);
        return {
            ...def,
            unlocked: userBadge?.isUnlocked || false,
            progress: userBadge?.currentProgress || 0
        };
    });

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <header className="flex items-center gap-4">
                <button onClick={() => setView(AppView.DASHBOARD)} className="text-zinc-400 hover:text-white"><IconBack /></button>
                <h1 className="text-xl font-display font-bold text-red-50">Minhas Conquistas</h1>
            </header>
            
            <div className="grid grid-cols-2 gap-4">
                {displayBadges.map(badge => (
                    <Card key={badge.id} className={`!p-4 border ${badge.unlocked ? 'border-metodo-gold/30 bg-gradient-to-br from-zinc-900 to-black' : 'border-zinc-800 bg-zinc-900/30 opacity-70'}`}>
                        <div className="flex flex-col items-center text-center h-full justify-between">
                            <div className={`p-3 rounded-full mb-3 ${badge.unlocked ? 'bg-metodo-gold/10' : 'bg-zinc-800'}`}>
                                <IconTrophy 
                                    size={24} 
                                    className={badge.unlocked ? Gamification.getBadgeIconColor(badge.tier) : 'text-zinc-600'} 
                                />
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm mb-1 ${badge.unlocked ? 'text-white' : 'text-zinc-500'}`}>{badge.name}</h3>
                                <p className="text-[10px] text-zinc-500 leading-tight">{badge.description}</p>
                            </div>
                            
                            {!badge.unlocked && (
                                <div className="w-full mt-4">
                                    <div className="flex justify-between text-[9px] text-zinc-500 font-bold uppercase mb-1">
                                        <span>Progresso</span>
                                        <span>{badge.progress} / {badge.requirementValue}</span>
                                    </div>
                                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-metodo-red h-full rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(100, (badge.progress / badge.requirementValue) * 100)}%`}}
                                        ></div>
                                    </div>
                                </div>
                            )}
                            {badge.unlocked && (
                                <div className="mt-3">
                                    <UIBadge>{badge.tier}</UIBadge>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
  };

  const renderActiveWorkout = () => {
    if (!currentSession) return null;

    return (
      <div className="pb-32 animate-fade-in relative">
        {/* Sticky Header */}
        <header className="sticky top-0 bg-black/95 backdrop-blur-xl z-40 py-4 px-1 border-b border-zinc-800 flex justify-between items-center mb-6 shadow-xl -mx-4 px-6">
          <div>
            <h2 className="text-white font-display font-bold text-lg uppercase tracking-wide">{currentSession.routineName}</h2>
            <div className="text-metodo-gold text-[10px] flex items-center gap-2 uppercase tracking-widest font-bold mt-1">
                <span className="w-2 h-2 rounded-full bg-metodo-gold animate-pulse"></span> Treino em andamento
            </div>
          </div>
          <button 
             onClick={() => {
                if(confirm("Cancelar treino? Dados serão perdidos.")) {
                    setActiveRoutine(null); 
                    setCurrentSession(null);
                    setView(AppView.DASHBOARD);
                }
             }}
             className="text-zinc-500 hover:text-red-500 p-3 rounded-full hover:bg-red-950/20 transition-colors"
          >
             <IconLogOut size={20} />
          </button>
        </header>

        <div className="space-y-6">
          {currentSession.exercises.map((exercise, exIndex) => {
             const routineExercise = activeRoutine?.exercises.find(e => e.id === exercise.exerciseId);
             const rec = aiRecommendations[exercise.exerciseId];
             
             return (
                <div key={exercise.exerciseId} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
                
                {/* AI Recommendation Banner */}
                {rec && (
                    <div className={`p-3 border-b flex items-start gap-3 ${rec.stagnationWarning ? 'bg-yellow-900/20 border-yellow-900/30' : 'bg-metodo-gold/5 border-metodo-gold/10'}`}>
                        <div className={`p-1.5 rounded-full ${rec.stagnationWarning ? 'bg-yellow-500/20 text-yellow-500' : 'bg-metodo-gold/20 text-metodo-gold'}`}>
                            {rec.stagnationWarning ? <IconZap size={14} /> : <IconBrain size={14} />}
                        </div>
                        <div>
                             <p className={`text-[10px] font-bold uppercase tracking-widest ${rec.stagnationWarning ? 'text-yellow-500' : 'text-metodo-gold'}`}>
                                 Coach IA: {rec.action === 'INCREASE' ? 'Aumentar Carga' : rec.action === 'DECREASE' ? 'Reduzir Carga' : rec.action === 'NEW' ? 'Novo Exercício' : 'Manter Carga'}
                             </p>
                             <p className="text-xs text-zinc-300 leading-tight mt-1">{rec.reasoning}</p>
                             {rec.suggestedWeight && rec.suggestedWeight > 0 && (
                                 <p className="text-xs font-bold text-white mt-1">
                                     Sugestão: <span className="text-metodo-gold">{rec.suggestedWeight}kg</span>
                                 </p>
                             )}
                        </div>
                    </div>
                )}

                {/* Exercise Header */}
                <div className="p-5 border-b border-zinc-800 bg-zinc-900/80">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-red-50 text-lg leading-tight w-3/4">{exercise.exerciseName}</h3>
                        <div className="flex gap-2">
                            <UIBadge>{routineExercise?.targetMuscle || exercise.targetMuscle || 'Geral'}</UIBadge>
                            <button 
                                onClick={() => setEditingNotesExerciseId(exercise.exerciseId)}
                                className={`p-1 rounded ${exercise.notes ? 'text-metodo-gold' : 'text-zinc-600 hover:text-zinc-400'}`}
                            >
                                <IconFileText size={18} />
                            </button>
                        </div>
                    </div>
                    {/* Notes Display/Edit */}
                    {editingNotesExerciseId === exercise.exerciseId ? (
                        <div className="mt-3 animate-fade-in">
                            <textarea 
                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-xs text-red-500 focus:border-metodo-gold focus:outline-none transition-colors"
                                placeholder="Observações para hoje..."
                                rows={2}
                                value={exercise.notes || ''}
                                onChange={(e) => updateExerciseNotes(exIndex, e.target.value)}
                                autoFocus
                                onBlur={() => setEditingNotesExerciseId(null)}
                            />
                        </div>
                    ) : (
                        exercise.notes && (
                            <p className="text-xs text-zinc-400 italic mt-2 border-l-2 border-metodo-gold/30 pl-3 py-1 cursor-pointer hover:text-white transition-colors" onClick={() => setEditingNotesExerciseId(exercise.exerciseId)}>
                                "{exercise.notes}"
                            </p>
                        )
                    )}
                </div>

                {/* Sets Table */}
                <div className="p-3 bg-black/20">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 text-[10px] text-zinc-600 text-center uppercase font-bold mb-3 px-2 tracking-wider">
                        <div className="col-span-2">Set</div>
                        <div className="col-span-4">Carga</div>
                        <div className="col-span-3">Reps</div>
                        <div className="col-span-3">Check</div>
                    </div>
                    
                    <div className="space-y-2">
                        {exercise.sets.map((set, setIndex) => (
                        <div key={set.id} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all duration-300 ${set.completed ? 'bg-metodo-gold/10 border border-metodo-gold/20' : 'bg-black/40 border border-transparent'}`}>
                            {/* Set Number */}
                            <div className="col-span-2 flex justify-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${set.completed ? 'bg-metodo-gold text-black' : 'text-zinc-500 bg-zinc-800'}`}>
                                    {setIndex + 1}
                                </div>
                            </div>

                            {/* Weight Input */}
                            <div className="col-span-4 px-1">
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        className={`w-full bg-transparent border-b text-center text-lg font-bold focus:outline-none transition-colors p-1 ${set.completed ? 'border-metodo-gold/50 text-metodo-gold' : 'border-zinc-700 text-red-500 focus:border-metodo-gold'}`}
                                        placeholder={String(rec?.suggestedWeight || routineExercise?.defaultWeight || '-')}
                                        value={set.weight || ''}
                                        onChange={(e) => updateSet(exIndex, setIndex, 'weight', Number(e.target.value))}
                                        disabled={set.completed}
                                    />
                                </div>
                            </div>

                            {/* Reps Input */}
                            <div className="col-span-3 px-1">
                                <div className="relative">
                                    <input 
                                        type="tel" 
                                        className={`w-full bg-transparent border-b text-center text-lg font-bold focus:outline-none transition-colors p-1 ${set.completed ? 'border-metodo-gold/50 text-metodo-gold' : 'border-zinc-700 text-red-500 focus:border-metodo-gold'}`}
                                        placeholder={routineExercise?.defaultReps || '-'}
                                        value={set.reps || ''}
                                        onChange={(e) => updateSet(exIndex, setIndex, 'reps', Number(e.target.value))}
                                        disabled={set.completed}
                                    />
                                </div>
                            </div>

                            {/* Check Button */}
                            <div className="col-span-3 flex justify-center">
                                <button 
                                    onClick={() => updateSet(exIndex, setIndex, 'completed', !set.completed)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg active:scale-95 ${
                                        set.completed 
                                        ? 'bg-metodo-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                                        : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-300'
                                    }`}
                                >
                                    <IconCheck size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
                </div>
             );
          })}
        </div>

        {/* Dynamic Add Exercise Button */}
        {!isAddingExercise ? (
            <div className="mt-8 mb-4">
                <Button variant="secondary" onClick={() => setIsAddingExercise(true)} className="w-full py-3 border-dashed border-zinc-700">
                    <IconPlus size={18} /> Adicionar Exercício Agora
                </Button>
            </div>
        ) : (
            <div className="mt-8 mb-4 bg-zinc-900 border border-metodo-gold/30 rounded-2xl p-4 animate-slide-up">
                <h3 className="text-sm font-bold text-metodo-gold uppercase tracking-widest mb-4">Novo Exercício</h3>
                <div className="space-y-3">
                    <Input 
                        placeholder="Nome do Exercício" 
                        value={tempExName} 
                        onChange={e => setTempExName(e.target.value)} 
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input 
                            placeholder="Músculo" 
                            value={tempExMuscle} 
                            onChange={e => setTempExMuscle(e.target.value)} 
                        />
                        <Input 
                            type="number"
                            placeholder="Sets" 
                            value={tempExSets} 
                            onChange={e => setTempExSets(Number(e.target.value))} 
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleAddDynamicExercise} className="flex-1 py-2 text-xs">Adicionar</Button>
                        <Button variant="ghost" onClick={() => setIsAddingExercise(false)} className="py-2 text-xs">Cancelar</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Sticky Footer Actions */}
        <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-30 flex flex-col items-center gap-4 border-t border-zinc-900/50 backdrop-blur-sm">
            <Button onClick={finishWorkout} className="w-full max-w-sm shadow-[0_0_40px_rgba(69,10,10,0.4)] py-4 text-lg">
                <IconSave size={20} /> Finalizar Treino
            </Button>
        </div>

        {showTimer && (
            <Timer 
                initialSeconds={timerDuration} 
                onComplete={() => {}} // Timer handles its own sound
                onClose={() => setShowTimer(false)}
            />
        )}
      </div>
    );
  };

  const renderWorkoutSummary = () => {
      if (!workoutSummary) return null;

      const getHighlightColor = (h: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE') => {
          if (h === 'POSITIVE') return 'text-metodo-gold';
          if (h === 'NEGATIVE') return 'text-red-500';
          return 'text-zinc-400';
      };

      const getBgHighlight = (h: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE') => {
        if (h === 'POSITIVE') return 'bg-metodo-gold/10 border-metodo-gold/30';
        if (h === 'NEGATIVE') return 'bg-red-950/30 border-red-900/30';
        return 'bg-zinc-900/50 border-zinc-800';
      };

      return (
          <div className="flex flex-col h-full animate-fade-in pb-10">
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-metodo-gold to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.4)] animate-pulse-slow">
                      <IconSparkles size={48} className="text-black" />
                  </div>
                  
                  <div>
                      <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight">Treino Finalizado</h1>
                      <p className="text-metodo-gold text-sm font-bold uppercase tracking-[0.2em] mt-2">Missão Cumprida</p>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-4 mt-8">
                      <Card className={`flex flex-col justify-center items-center !py-6 ${getBgHighlight(workoutSummary.highlight)}`}>
                          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Volume</p>
                          <div className="flex items-end gap-1 mt-1">
                              <span className={`text-2xl font-bold font-display ${workoutSummary.volumeDelta > 0 ? 'text-white' : 'text-zinc-400'}`}>
                                  {workoutSummary.volumeDelta > 0 ? '+' : ''}{workoutSummary.volumeDelta}%
                              </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1">{workoutSummary.volumeDiffValue > 0 ? `+${workoutSummary.volumeDiffValue}kg` : `${workoutSummary.volumeDiffValue}kg`}</p>
                      </Card>
                      
                      <Card className="flex flex-col justify-center items-center !py-6 bg-zinc-900/50 border-zinc-800">
                          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Intensidade</p>
                          <div className="flex items-end gap-1 mt-1">
                               <span className={`text-2xl font-bold font-display ${workoutSummary.loadDelta > 0 ? 'text-white' : 'text-zinc-400'}`}>
                                  {workoutSummary.loadDelta > 0 ? '+' : ''}{workoutSummary.loadDelta}%
                              </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1">Carga Média</p>
                      </Card>
                  </div>

                  <Card className="w-full bg-zinc-900 border-l-4 border-l-metodo-red !p-6 text-left relative overflow-hidden">
                      <IconZap className="absolute top-4 right-4 text-zinc-800" size={60} />
                      <h3 className="text-xs font-bold text-metodo-red uppercase tracking-widest mb-2 relative z-10">Análise de Performance</h3>
                      <p className={`text-sm font-medium leading-relaxed relative z-10 ${getHighlightColor(workoutSummary.highlight)}`}>
                          "{workoutSummary.message}"
                      </p>
                  </Card>
              </div>

              <div className="mt-8 w-full">
                  <Button onClick={() => setView(AppView.DASHBOARD)} className="w-full py-4 text-lg">
                      Voltar ao Início
                  </Button>
              </div>
          </div>
      );
  };

  const renderSelectRoutine = () => (
    <div className="space-y-8 animate-fade-in pb-10" onClick={() => setActiveMenuRoutineId(null)}>
        <header className="flex items-center gap-4">
            <button onClick={() => setView(AppView.DASHBOARD)} className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-900 rounded-full transition-colors"><IconBack /></button>
            <h1 className="text-xl font-display font-bold tracking-wide text-red-50">Selecionar Ficha</h1>
            <Button variant="secondary" onClick={() => prepareCreateRoutine()} className="ml-auto text-xs px-3 py-2">
                <IconPlus size={16} /> Nova
            </Button>
        </header>

        <div className="grid gap-5">
          {routines.map(routine => (
            <Card key={routine.id} className="relative overflow-visible group hover:-translate-y-1 transition-transform duration-300 border-zinc-800">
              <div 
                className="cursor-pointer" 
                onClick={() => startWorkout(routine)}
              >
                  <div className="absolute top-4 right-12 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none grayscale">
                    <IconDumbbell size={80} />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-metodo-red transition-colors pr-10 uppercase tracking-wide">{routine.name}</h3>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {routine.targetMuscles.map(m => <UIBadge key={m}>{m}</UIBadge>)}
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{routine.exercises.length} Exercícios</span>
                    <span className="text-xs text-metodo-red font-bold uppercase tracking-wider flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                        Iniciar <IconPlay size={12} fill="currentColor" />
                    </span>
                  </div>
              </div>

              {/* Context Menu Button */}
              <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuRoutineId(activeMenuRoutineId === routine.id ? null : routine.id);
                  }}
                  className="absolute top-4 right-4 text-zinc-600 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors"
              >
                  <IconMore size={20} />
              </button>

              {/* Dropdown Menu */}
              {activeMenuRoutineId === routine.id && (
                  <div className="absolute top-12 right-4 w-44 bg-black border border-zinc-700 shadow-2xl rounded-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <button 
                          onClick={(e) => { e.stopPropagation(); prepareCreateRoutine(routine); }}
                          className="w-full text-left px-4 py-3 text-xs font-bold uppercase text-zinc-300 hover:bg-zinc-900 hover:text-metodo-gold flex items-center gap-3 transition-colors"
                      >
                          <IconEdit size={14} /> Editar
                      </button>
                      <button 
                          onClick={(e) => { e.stopPropagation(); duplicateRoutine(routine); }}
                          className="w-full text-left px-4 py-3 text-xs font-bold uppercase text-zinc-300 hover:bg-zinc-900 hover:text-metodo-gold flex items-center gap-3 transition-colors"
                      >
                          <IconCopy size={14} /> Duplicar
                      </button>
                      <button 
                          onClick={(e) => { e.stopPropagation(); handleExportRoutinePdf(routine); }}
                          className="w-full text-left px-4 py-3 text-xs font-bold uppercase text-zinc-300 hover:bg-zinc-900 hover:text-metodo-gold flex items-center gap-3 transition-colors"
                      >
                          <IconShare size={14} /> Exportar PDF
                      </button>
                      <div className="h-px bg-zinc-800 mx-2"></div>
                      <button 
                          onClick={(e) => { e.stopPropagation(); deleteRoutine(routine.id); }}
                          className="w-full text-left px-4 py-3 text-xs font-bold uppercase text-red-500 hover:bg-red-950/30 flex items-center gap-3 transition-colors"
                      >
                          <IconTrash size={14} /> Excluir
                      </button>
                  </div>
              )}
            </Card>
          ))}
          {routines.length === 0 && (
            <div className="text-center p-12 border border-dashed border-zinc-800 rounded-2xl text-zinc-600 bg-zinc-900/20">
                <IconDumbbell size={40} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm mb-6 text-red-100">Nenhuma ficha encontrada.</p>
                <Button variant="secondary" onClick={() => prepareCreateRoutine()} className="w-full max-w-xs mx-auto">
                    <IconPlus size={16} /> Criar Primeira Ficha
                </Button>
            </div>
          )}
        </div>
    </div>
  );

  const renderHistory = () => {
    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.routineName.toLowerCase().includes(historySearch.toLowerCase()) || 
            new Date(log.startTime).toLocaleDateString().includes(historySearch);
        const matchesMuscle = !historyFilterMuscle || log.exercises.some(ex => 
            (ex.targetMuscle || '').toLowerCase().includes(historyFilterMuscle.toLowerCase())
        );
        return matchesSearch && matchesMuscle;
    });

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView(AppView.DASHBOARD)} className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-900 rounded-full"><IconBack /></button>
                    <h1 className="text-xl font-display font-bold text-red-50">Histórico</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportHistoryPdf} className="text-metodo-gold border border-metodo-gold/20 hover:bg-metodo-gold/10 p-2 rounded-lg" title="Exportar Relatório Completo">
                        <IconPrinter size={20} />
                    </button>
                    <Button variant="ghost" className="text-metodo-gold border border-metodo-gold/20 hover:bg-metodo-gold/10 text-xs px-3 py-2" onClick={() => setView(AppView.AI_ANALYSIS)}>
                        <IconBrain size={16} /> Coach IA
                    </Button>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl space-y-3">
                <div className="relative">
                    <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={16} />
                    <Input 
                        placeholder="Buscar por nome ou data..." 
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="pl-12 text-sm"
                    />
                </div>
                <div className="relative">
                    <IconFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={16} />
                    <Input 
                        placeholder="Filtrar por músculo (ex: Peito)..." 
                        value={historyFilterMuscle}
                        onChange={(e) => setHistoryFilterMuscle(e.target.value)}
                        className="pl-12 text-sm"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredLogs.length === 0 ? (
                    <div className="text-zinc-500 text-center py-10 border border-dashed border-zinc-800 rounded-2xl">
                        Nenhum treino encontrado com estes filtros.
                    </div>
                ) : filteredLogs.map(log => (
                    <Card key={log.id} className="relative overflow-hidden cursor-pointer hover:border-zinc-600 transition-colors" onClick={() => { setSelectedLog(log); setView(AppView.HISTORY_DETAILS); }}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-red-50 text-lg">{log.routineName}</h3>
                                <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                                    <IconCalendar size={12} /> {new Date(log.startTime).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="block text-metodo-gold font-mono text-xl font-bold">
                                    {log.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)}
                                </span>
                                <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-600">Séries</span>
                            </div>
                        </div>
                        <div className="border-t border-zinc-800 pt-3 mt-2">
                            <p className="text-xs text-zinc-400 truncate">
                                {log.exercises.map(e => e.exerciseName).join(', ')}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
  };

  const renderHistoryDetails = () => {
    if (!selectedLog) return null;
    
    // Calculate stats for this specific log
    const totalVolume = selectedLog.exercises.reduce((acc, ex) => 
        acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => sAcc + s.weight * s.reps, 0)
    , 0);
    const duration = selectedLog.endTime ? Math.round((selectedLog.endTime - selectedLog.startTime) / 60000) : '-';

    return (
        <div className="space-y-8 animate-fade-in pb-10">
             <header className="flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur z-20 py-4 -mx-4 px-4 border-b border-zinc-900">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView(AppView.HISTORY)} className="text-zinc-400 hover:text-white"><IconBack /></button>
                    <h1 className="text-xl font-display font-bold text-red-50">Detalhes do Treino</h1>
                </div>
                <button onClick={() => handleExportLogPdf(selectedLog)} className="text-metodo-gold hover:text-white p-2" title="Baixar PDF">
                    <IconShare size={20} />
                </button>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <Card className="flex flex-col items-center justify-center py-6 bg-zinc-900/50">
                    <span className="text-3xl font-bold text-white font-display">{duration} <span className="text-sm font-sans text-zinc-500 font-normal">min</span></span>
                    <span className="text-[10px] uppercase text-zinc-500 tracking-widest mt-1">Duração Total</span>
                </Card>
                <Card className="flex flex-col items-center justify-center py-6 bg-zinc-900/50">
                    <span className="text-3xl font-bold text-metodo-gold font-display">{Math.round(totalVolume / 1000)}<span className="text-sm font-sans text-zinc-500 font-normal">ton</span></span>
                    <span className="text-[10px] uppercase text-zinc-500 tracking-widest mt-1">Volume Total</span>
                </Card>
            </div>

            <div className="space-y-6">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-display font-bold text-red-50">{selectedLog.routineName}</h2>
                    <p className="text-zinc-500 text-sm">{new Date(selectedLog.startTime).toLocaleDateString('pt-BR', {dateStyle: 'full'})}</p>
                </div>

                {selectedLog.exercises.map(ex => (
                    <div key={ex.exerciseId} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4">
                        <div className="mb-3 flex justify-between items-start">
                             <div>
                                <h3 className="font-bold text-red-100 text-base">{ex.exerciseName}</h3>
                                {ex.notes && <p className="text-xs text-zinc-500 italic mt-1">"{ex.notes}"</p>}
                             </div>
                             <UIBadge>{ex.targetMuscle || 'Geral'}</UIBadge>
                        </div>
                        <div className="space-y-1.5">
                            {ex.sets.map((set, idx) => (
                                <div key={set.id} className={`flex justify-between items-center text-sm p-2 rounded-lg ${set.completed ? 'bg-zinc-800/50 border border-zinc-700/50' : 'opacity-40'}`}>
                                    <span className="font-mono text-zinc-500 w-6 text-xs">#{idx + 1}</span>
                                    <span className="text-white font-bold">{set.weight}kg</span>
                                    <span className="text-zinc-400">x {set.reps} reps</span>
                                    {set.completed ? <IconCheck size={14} className="text-metodo-gold" /> : <span className="w-3.5"/>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderCreateRoutine = () => (
    <div className="space-y-6 animate-fade-in pb-32">
        <header className="flex items-center gap-4 sticky top-0 bg-black/95 backdrop-blur z-20 py-4 -mx-4 px-4 border-b border-zinc-900">
            <button onClick={() => setView(AppView.DASHBOARD)} className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-900 rounded-full"><IconBack /></button>
            <h1 className="text-xl font-display font-bold text-red-50">{editingRoutineId ? 'Editar Ficha' : 'Nova Ficha'}</h1>
        </header>

        {/* Routine Info */}
        <Card className="space-y-5 border-l-4 border-l-metodo-red">
            <h2 className="text-xs font-bold text-red-200 uppercase tracking-widest mb-2 flex items-center gap-2"><IconEdit size={12}/> Informações Básicas</h2>
            <div>
                <label className="text-[10px] uppercase text-zinc-500 mb-2 block font-bold tracking-wider">Nome do Treino</label>
                <Input placeholder="Ex: Peito e Tríceps" value={newRoutineName} onChange={e => setNewRoutineName(e.target.value)} />
            </div>
            <div>
                <label className="text-[10px] uppercase text-zinc-500 mb-2 block font-bold tracking-wider">Foco Muscular</label>
                <Input placeholder="Ex: Peito, Tríceps, Ombros" value={newRoutineMuscles} onChange={e => setNewRoutineMuscles(e.target.value)} />
            </div>
        </Card>

        {/* Add Exercise Form */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-lg">
            <h2 className="text-xs font-bold text-metodo-gold uppercase tracking-widest flex items-center gap-2">
                <IconPlus size={16} /> Adicionar Exercício
            </h2>
            
            <div className="space-y-4">
                <div className="relative">
                    <IconDumbbell className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={18} />
                    <Input 
                        placeholder="Nome do Exercício" 
                        value={tempExName} 
                        onChange={e => setTempExName(e.target.value)} 
                        className="pl-12"
                    />
                </div>

                <div className="relative">
                    <IconMuscle className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={18} />
                    <Input 
                        placeholder="Grupo Muscular (Ex: Peito)" 
                        value={tempExMuscle} 
                        onChange={e => setTempExMuscle(e.target.value)} 
                        className="pl-12"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase text-zinc-500 mb-2 block font-bold tracking-wider">Séries</label>
                        <div className="relative">
                            <IconLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={18} />
                            <Input 
                                type="number" 
                                placeholder="3" 
                                value={tempExSets} 
                                onChange={e => setTempExSets(Number(e.target.value))} 
                                className="pl-12"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase text-zinc-500 mb-2 block font-bold tracking-wider">Repetições</label>
                        <div className="relative">
                            <IconRepeat className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={18} />
                            <Input 
                                placeholder="8-12" 
                                value={tempExReps} 
                                onChange={e => setTempExReps(e.target.value)} 
                                className="pl-12"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase text-zinc-500 mb-2 block font-bold tracking-wider">Carga (kg)</label>
                        <div className="relative">
                            <IconScale className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={18} />
                            <Input 
                                type="number" 
                                placeholder="Opcional" 
                                value={tempExWeight || ''} 
                                onChange={e => setTempExWeight(e.target.value ? Number(e.target.value) : undefined)} 
                                className="pl-12"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase text-zinc-500 mb-2 block font-bold tracking-wider">Descanso (s)</label>
                        <div className="relative">
                            <IconClock className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={18} />
                            <Input 
                                type="number" 
                                placeholder="60" 
                                value={tempExRest} 
                                onChange={e => setTempExRest(Number(e.target.value))} 
                                className="pl-12"
                            />
                        </div>
                    </div>
                </div>

                <div>
                     <label className="text-[10px] uppercase text-zinc-500 mb-2 block font-bold tracking-wider">Observações</label>
                     <div className="relative">
                        <IconFileText className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={18} />
                        <Input 
                            placeholder="Ex: Drop-set na última" 
                            value={tempExNotes} 
                            onChange={e => setTempExNotes(e.target.value)} 
                            className="pl-12"
                        />
                     </div>
                </div>

                <Button variant="secondary" onClick={addExerciseToRoutine} disabled={!tempExName} className="w-full mt-2">
                    Confirmar Exercício
                </Button>
            </div>
        </div>

        {/* Exercises List */}
        <div className="space-y-4">
             <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-2">Resumo da Ficha ({newExercises.length})</h2>
             {newExercises.length === 0 ? (
                 <div className="text-center py-12 text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                     Nenhum exercício adicionado.
                 </div>
             ) : (
                 newExercises.map((ex, idx) => (
                     <Card key={idx} className="!p-5 relative group hover:border-zinc-700">
                         <button 
                            onClick={() => setNewExercises(prev => prev.filter((_, i) => i !== idx))} 
                            className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 p-2 hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <IconTrash size={18}/>
                         </button>
                         
                         <h3 className="text-red-50 font-bold text-lg pr-12">{ex.name}</h3>
                         <div className="flex flex-wrap gap-2 mt-3">
                             <UIBadge>{ex.targetMuscle}</UIBadge>
                             <span className="text-[10px] uppercase font-bold text-zinc-400 border border-zinc-800 px-2 py-1 rounded flex items-center gap-1">
                                <IconLayers size={10} /> {ex.defaultSets} Sets
                             </span>
                             <span className="text-[10px] uppercase font-bold text-zinc-400 border border-zinc-800 px-2 py-1 rounded flex items-center gap-1">
                                <IconRepeat size={10} /> {ex.defaultReps} Reps
                             </span>
                             {ex.defaultWeight && (
                                 <span className="text-[10px] uppercase font-bold text-zinc-400 border border-zinc-800 px-2 py-1 rounded flex items-center gap-1">
                                    <IconScale size={10} /> {ex.defaultWeight}kg
                                 </span>
                             )}
                             <span className="text-[10px] uppercase font-bold text-zinc-400 border border-zinc-800 px-2 py-1 rounded flex items-center gap-1">
                                <IconClock size={10} /> {ex.defaultRestSeconds}s
                             </span>
                         </div>
                         {ex.notes && (
                             <div className="mt-3 text-xs text-zinc-500 italic bg-black/30 p-3 rounded-lg border border-zinc-800/50">
                                 "{ex.notes}"
                             </div>
                         )}
                     </Card>
                 ))
             )}
        </div>

        {/* Sticky Save Button */}
        <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-30">
            <Button 
                onClick={handleCreateOrUpdateRoutine} 
                className="w-full max-w-sm mx-auto shadow-2xl shadow-metodo-red/30 py-4" 
                disabled={!newRoutineName || newExercises.length === 0}
            >
                <IconSave size={18} /> {editingRoutineId ? 'Atualizar Ficha' : 'Salvar Ficha'}
            </Button>
        </div>
    </div>
  );

  const renderAiAnalysis = () => (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <header className="flex items-center gap-4">
                <button onClick={() => setView(AppView.HISTORY)} className="text-zinc-400 hover:text-white"><IconBack /></button>
                <h1 className="text-xl font-display font-bold text-red-50">Coach IA <span className="text-metodo-gold">MÉTODO M</span></h1>
            </header>

            {/* Tab Navigation */}
            <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                <button 
                    onClick={() => setAnalysisTab('GENERAL')} 
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${analysisTab === 'GENERAL' ? 'bg-metodo-red text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Análise Geral
                </button>
                <button 
                    onClick={() => setAnalysisTab('MONTHLY')} 
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${analysisTab === 'MONTHLY' ? 'bg-metodo-red text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Relatório Mensal
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center">
                
                {/* GENERAL TAB */}
                {analysisTab === 'GENERAL' && (
                    !aiAnalysis ? (
                        <div className="text-center space-y-8 mt-12 px-6">
                            <div className="w-24 h-24 rounded-full bg-metodo-gold/10 flex items-center justify-center mx-auto animate-pulse-slow">
                                <IconBrain size={48} className="text-metodo-gold" />
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                                A Inteligência Artificial irá analisar seu histórico de volume, frequência e cargas para identificar gargalos e otimizar sua hipertrofia.
                            </p>
                            <Button onClick={runAiAnalysis} disabled={isLoadingAi} className="w-full">
                                {isLoadingAi ? 'Processando dados...' : 'Gerar Análise Completa'}
                            </Button>
                        </div>
                    ) : (
                        <Card className="w-full animate-fade-in border-metodo-gold/30 bg-zinc-900/80">
                            <div className="prose prose-invert prose-sm max-w-none">
                                <div className="whitespace-pre-wrap font-sans text-red-50 leading-relaxed">
                                    {aiAnalysis}
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-zinc-800">
                                <Button variant="ghost" onClick={() => setAiAnalysis('')} className="w-full text-zinc-500 hover:text-white text-xs uppercase tracking-widest">
                                    Nova Análise
                                </Button>
                            </div>
                        </Card>
                    )
                )}

                {/* MONTHLY TAB */}
                {analysisTab === 'MONTHLY' && (
                    !aiMonthlyReport ? (
                         <div className="text-center space-y-8 mt-12 px-6">
                            <div className="w-24 h-24 rounded-full bg-red-950/30 flex items-center justify-center mx-auto animate-pulse-slow">
                                <IconCalendarCheck size={48} className="text-metodo-red" />
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                                Compare seu desempenho atual com o mês anterior. Descubra sua evolução em carga, volume e consistência.
                            </p>
                            <Button onClick={runMonthlyAnalysis} disabled={isLoadingAi} className="w-full">
                                {isLoadingAi ? 'Calculando Estatísticas...' : 'Gerar Relatório Mensal'}
                            </Button>
                        </div>
                    ) : (
                        <div className="w-full space-y-6 animate-fade-in">
                            {/* Comparison Stats Cards */}
                            {monthlyStats && (
                                <div className="grid grid-cols-2 gap-3">
                                    <Card className="!p-4 bg-zinc-900 border-zinc-800">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Volume</p>
                                        <div className="flex items-end gap-2 mt-1">
                                            <span className="text-xl font-bold text-white">{Math.round(monthlyStats.current.totalVolume / 1000)}t</span>
                                            <span className={`text-xs font-bold ${monthlyStats.volumeDeltaPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {monthlyStats.volumeDeltaPercent > 0 ? '+' : ''}{monthlyStats.volumeDeltaPercent}%
                                            </span>
                                        </div>
                                    </Card>
                                    <Card className="!p-4 bg-zinc-900 border-zinc-800">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Frequência</p>
                                        <div className="flex items-end gap-2 mt-1">
                                            <span className="text-xl font-bold text-white">{monthlyStats.current.totalWorkouts}</span>
                                            <span className={`text-xs font-bold ${monthlyStats.frequencyDeltaPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {monthlyStats.frequencyDeltaPercent > 0 ? '+' : ''}{monthlyStats.frequencyDeltaPercent}%
                                            </span>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            <Card className="w-full border-l-4 border-l-metodo-red bg-zinc-900/80">
                                <h3 className="text-xs font-bold text-metodo-red uppercase tracking-widest mb-4">Análise do Coach</h3>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <div className="whitespace-pre-wrap font-sans text-red-50 leading-relaxed">
                                        {aiMonthlyReport}
                                    </div>
                                </div>
                            </Card>
                             
                             {/* Best Exercises */}
                            {monthlyStats && monthlyStats.bestExercises.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">Destaques do Mês</h3>
                                    <div className="space-y-2">
                                        {monthlyStats.bestExercises.map((ex, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-metodo-gold font-bold text-sm">#{i+1}</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{ex.name}</p>
                                                        <p className="text-[10px] text-zinc-500 uppercase">{ex.muscle}</p>
                                                    </div>
                                                </div>
                                                <div className="font-mono text-sm font-bold text-red-100">{ex.weight}kg</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 border-t border-zinc-800">
                                <Button variant="ghost" onClick={() => { setAiMonthlyReport(''); setMonthlyStats(null); }} className="w-full text-zinc-500 hover:text-white text-xs uppercase tracking-widest">
                                    Limpar Relatório
                                </Button>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );

    const renderAiPlanner = () => (
    <div className="space-y-6 animate-fade-in pb-10 h-full flex flex-col">
        <header className="flex items-center gap-4">
            <button onClick={() => setView(AppView.DASHBOARD)} className="text-zinc-400 hover:text-white"><IconBack /></button>
            <h1 className="text-xl font-display font-bold text-red-50">Planejador IA</h1>
        </header>

        {!generatedPlan ? (
            <div className="flex-1 flex flex-col space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-center">
                    <div className="w-16 h-16 bg-metodo-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconRobot size={32} className="text-metodo-gold" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">Construa sua Periodização</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        A Inteligência Artificial analisará seu perfil e histórico para criar uma rotina semanal completa e otimizada.
                    </p>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] uppercase text-zinc-500 mb-2 block font-bold tracking-wider">Objetivo Principal</label>
                        <div className="relative">
                            <IconTarget className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={18} />
                            <select 
                                value={planGoal} 
                                onChange={(e) => setPlanGoal(e.target.value as UserGoal)}
                                className="w-full bg-black border border-zinc-800 rounded-xl p-4 pl-12 text-white text-sm focus:border-metodo-gold focus:outline-none appearance-none"
                            >
                                <option value="HYPERTROPHY">Hipertrofia (Ganho de Massa)</option>
                                <option value="STRENGTH">Força Pura</option>
                                <option value="DEFINITION">Definição / Cutting</option>
                                <option value="REHAB">Resistência / Reabilitação</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase text-zinc-500 mb-2 block font-bold tracking-wider">Nível de Experiência</label>
                        <div className="relative">
                            <IconMuscle className="absolute left-4 top-1/2 -translate-y-1/2 text-metodo-red" size={18} />
                            <select 
                                value={planLevel} 
                                onChange={(e) => setPlanLevel(e.target.value as UserLevel)}
                                className="w-full bg-black border border-zinc-800 rounded-xl p-4 pl-12 text-white text-sm focus:border-metodo-gold focus:outline-none appearance-none"
                            >
                                <option value="BEGINNER">Iniciante (0-6 meses)</option>
                                <option value="INTERMEDIATE">Intermediário (6 meses - 2 anos)</option>
                                <option value="ADVANCED">Avançado (+2 anos)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase text-zinc-500 mb-2 block font-bold tracking-wider flex justify-between">
                            <span>Dias por Semana</span>
                            <span className="text-metodo-gold">{planDays} dias</span>
                        </label>
                        <input 
                            type="range" 
                            min="2" 
                            max="6" 
                            step="1" 
                            value={planDays}
                            onChange={(e) => setPlanDays(Number(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-metodo-red"
                        />
                        <div className="flex justify-between text-[9px] text-zinc-600 font-bold px-1 mt-2 uppercase tracking-widest">
                            <span>Mínimo (2)</span>
                            <span>Máximo (6)</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-6">
                    <Button onClick={handleGeneratePlan} disabled={isLoadingAi} className="w-full py-4 shadow-lg shadow-metodo-red/20">
                        {isLoadingAi ? (
                            <span className="flex items-center gap-2">
                                <IconRefresh className="animate-spin" /> Analisando Perfil...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <IconSparkles /> Gerar Rotina com IA
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        ) : (
            <div className="space-y-6 pb-24">
                <div className="bg-gradient-to-r from-zinc-900 to-black border border-green-900/50 p-4 rounded-xl flex items-center gap-4 animate-slide-up">
                    <div className="p-3 bg-green-900/20 rounded-full text-green-500">
                        <IconCheck size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Plano Gerado com Sucesso!</h3>
                        <p className="text-xs text-zinc-400">A IA criou {generatedPlan.length} novas fichas para você.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {generatedPlan.map((routine, idx) => (
                        <Card key={idx} className="!p-4 bg-zinc-900/50 border-zinc-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <IconDumbbell size={60} />
                            </div>
                            <h3 className="text-red-50 font-bold mb-2 text-lg">{routine.name}</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {routine.targetMuscles?.map(m => <UIBadge key={m}>{m}</UIBadge>)}
                            </div>
                            <div className="bg-black/30 rounded-lg p-3 border border-zinc-800/50">
                                <ul className="space-y-2">
                                    {routine.exercises?.map((ex, i) => (
                                        <li key={i} className="text-xs text-zinc-300 flex justify-between items-center border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                                            <span className="font-medium">{ex.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[9px] text-zinc-500 font-mono">{ex.defaultSets}x{ex.defaultReps}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-30 flex flex-col gap-3 backdrop-blur-sm border-t border-zinc-900/50">
                    <Button onClick={() => saveGeneratedPlan(true)} className="w-full">
                        <IconSave size={18} /> Substituir Minhas Fichas
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={() => saveGeneratedPlan(false)} className="w-full text-xs">
                            <IconPlus size={14} /> Adicionar às Atuais
                        </Button>
                        <Button variant="ghost" onClick={() => setGeneratedPlan(null)} className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20">
                            <IconTrash size={14} /> Descartar
                        </Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderSettings = () => (
      <div className="space-y-8 animate-fade-in pb-10">
        <header className="flex items-center gap-4">
            <button onClick={() => setView(AppView.DASHBOARD)} className="text-zinc-400 hover:text-white"><IconBack /></button>
            <h1 className="text-xl font-display font-bold text-red-50">Configurações</h1>
        </header>

        <div className="space-y-6">
            <Card className="flex justify-between items-center">
                <div>
                     <h3 className="text-white font-bold mb-1 uppercase tracking-widest text-xs flex items-center gap-2">
                        <IconBell size={14} className="text-metodo-gold" /> Notificações
                    </h3>
                    <p className="text-[10px] text-zinc-500">Alertas motivacionais inteligentes</p>
                </div>
                <div 
                    onClick={toggleNotifications}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${user?.preferences?.enabled ? 'bg-metodo-red' : 'bg-zinc-800'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${user?.preferences?.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
            </Card>

            <Card>
                <h3 className="text-metodo-gold font-bold mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                    <IconDownload size={14} /> Backup & Exportação
                </h3>
                <p className="text-zinc-500 text-xs mb-4 leading-relaxed">
                    Exporte seus dados para manter um backup seguro ou transferir para outro dispositivo. O arquivo JSON contém todo seu histórico.
                </p>
                <Button variant="secondary" onClick={handleExportData} className="w-full">
                    Exportar Dados (JSON)
                </Button>
            </Card>

            <Card>
                <h3 className="text-red-50 font-bold mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                    <IconUpload size={14} /> Restaurar Dados
                </h3>
                <p className="text-zinc-500 text-xs mb-4 leading-relaxed">
                    Importe um arquivo de backup (.json). Cuidado: isso irá mesclar com seus dados atuais.
                </p>
                <label className="flex flex-col items-center px-4 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl shadow-inner tracking-wide uppercase cursor-pointer hover:bg-zinc-800 hover:text-white transition-all group">
                    <span className="text-[10px] font-bold group-hover:text-metodo-gold transition-colors">Selecionar Arquivo</span>
                    <input type='file' className="hidden" accept=".json" onChange={handleImportData} />
                </label>
            </Card>

            <div className="pt-8 border-t border-zinc-900 text-center space-y-2">
                <p className="text-zinc-600 text-xs font-mono">IronLog System v2.1.0</p>
                <p className="text-zinc-700 text-[10px] uppercase tracking-widest">Método M // Powered by Gemini</p>
            </div>
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-metodo-red selection:text-white flex items-center justify-center md:p-8">
      {/* Desktop Wrapper / Mobile Container */}
      <div className="w-full max-w-md bg-black md:rounded-[2.5rem] md:shadow-2xl md:border md:border-zinc-800 overflow-hidden min-h-screen md:min-h-[850px] relative flex flex-col">
          <div className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar relative z-10">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black -z-10 pointer-events-none"></div>
            
            {view === AppView.AUTH && renderAuth()}
            {view === AppView.DASHBOARD && renderDashboard()}
            {view === AppView.SELECT_ROUTINE && renderSelectRoutine()}
            {view === AppView.ACTIVE_WORKOUT && renderActiveWorkout()}
            {view === AppView.CREATE_ROUTINE && renderCreateRoutine()}
            {view === AppView.HISTORY && renderHistory()}
            {view === AppView.HISTORY_DETAILS && renderHistoryDetails()}
            {view === AppView.AI_ANALYSIS && renderAiAnalysis()}
            {view === AppView.AI_PLANNER && renderAiPlanner()}
            {view === AppView.SETTINGS && renderSettings()}
            {view === AppView.ACHIEVEMENTS && renderAchievements()}
            {view === AppView.WORKOUT_SUMMARY && renderWorkoutSummary()}
            {view === AppView.PROGRESS && (
            <ProgressView 
                logs={logs} 
                onBack={() => setView(AppView.DASHBOARD)} 
                onAiClick={() => setView(AppView.AI_ANALYSIS)} 
            />
            )}
          </div>
      </div>
    </div>
  );
};

export default App;
