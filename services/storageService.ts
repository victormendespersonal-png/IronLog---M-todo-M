
import { WorkoutRoutine, WorkoutLog, User, UserBadge } from '../types';

const USERS_KEY = 'ironlog_users';
const ROUTINES_KEY = 'ironlog_routines';
const LOGS_KEY = 'ironlog_logs';
const SESSION_KEY = 'ironlog_session';
const BADGES_KEY = 'ironlog_badges';

// --- User Management ---

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const findUser = (email: string): User | undefined => {
  return getUsers().find(u => u.email === email);
};

// --- Session ---

export const saveSession = (user: User) => {
  // Store full user object minus password (if it existed)
  const { password, ...safeUser } = user as any;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user: safeUser, timestamp: Date.now() }));
};

export const getSession = (): User | null => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data).user : null;
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

// --- Data Filtering by User ---

export const saveRoutines = (routines: WorkoutRoutine[]) => {
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
};

export const getRoutines = (userId?: string): WorkoutRoutine[] => {
  const data = localStorage.getItem(ROUTINES_KEY);
  const allRoutines: WorkoutRoutine[] = data ? JSON.parse(data) : [];
  if (!userId) return allRoutines;
  return allRoutines.filter(r => r.userId === userId);
};

export const removeRoutine = (routineId: string) => {
    const allRoutines = getRoutines();
    const updatedRoutines = allRoutines.filter(r => r.id !== routineId);
    saveRoutines(updatedRoutines);
};

export const saveWorkoutLog = (log: WorkoutLog) => {
  const logs = getAllWorkoutLogsRaw();
  logs.unshift(log); // Add to beginning
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};

export const updateWorkoutLog = (updatedLog: WorkoutLog) => {
    const logs = getAllWorkoutLogsRaw();
    const index = logs.findIndex(l => l.id === updatedLog.id);
    if (index !== -1) {
        logs[index] = updatedLog;
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    }
};

export const deleteWorkoutLog = (logId: string) => {
    const logs = getAllWorkoutLogsRaw();
    const filtered = logs.filter(l => l.id !== logId);
    localStorage.setItem(LOGS_KEY, JSON.stringify(filtered));
};

const getAllWorkoutLogsRaw = (): WorkoutLog[] => {
  const data = localStorage.getItem(LOGS_KEY);
  return data ? JSON.parse(data) : [];
}

export const getWorkoutLogs = (userId?: string): WorkoutLog[] => {
  const allLogs = getAllWorkoutLogsRaw();
  if (!userId) return allLogs;
  return allLogs.filter(l => l.userId === userId);
};

// --- Badges ---

export const getUserBadges = (userId: string): UserBadge[] => {
    const data = localStorage.getItem(BADGES_KEY);
    const allBadges: UserBadge[] = data ? JSON.parse(data) : [];
    return allBadges.filter(b => b.userId === userId);
};

export const saveUserBadges = (badges: UserBadge[]) => {
    // We need to merge with existing badges of OTHER users
    const data = localStorage.getItem(BADGES_KEY);
    let allBadges: UserBadge[] = data ? JSON.parse(data) : [];
    
    // Remove old badges for this user to overwrite
    if (badges.length > 0) {
        const userId = badges[0].userId;
        allBadges = allBadges.filter(b => b.userId !== userId);
        allBadges = [...allBadges, ...badges];
    }
    
    localStorage.setItem(BADGES_KEY, JSON.stringify(allBadges));
};

// --- Backup ---

export const getFullBackup = (userId: string) => {
  return {
    user: getSession(),
    routines: getRoutines(userId),
    logs: getWorkoutLogs(userId),
    badges: getUserBadges(userId),
    exportedAt: Date.now()
  };
};

export const restoreBackup = (data: any) => {
  // Merging strategy
  if (data.routines) {
     const current = getRoutines();
     const newIds = new Set(data.routines.map((r: any) => r.id));
     const kept = current.filter(r => !newIds.has(r.id));
     saveRoutines([...kept, ...data.routines]);
  }
  if (data.logs) {
      const current = getAllWorkoutLogsRaw();
      const newIds = new Set(data.logs.map((l: any) => l.id));
      const kept = current.filter(l => !newIds.has(l.id));
      localStorage.setItem(LOGS_KEY, JSON.stringify([...data.logs, ...kept]));
  }
  if (data.badges) {
      const current = JSON.parse(localStorage.getItem(BADGES_KEY) || '[]');
      const userId = data.user?.id;
      if (userId) {
          const others = current.filter((b: any) => b.userId !== userId);
          localStorage.setItem(BADGES_KEY, JSON.stringify([...others, ...data.badges]));
      }
  }
};

// --- Seeding ---

export const seedInitialData = (userId: string) => {
  const userRoutines = getRoutines(userId);
  if (userRoutines.length === 0) {
    const initialRoutines: WorkoutRoutine[] = [
      {
        id: `seed_${userId}_A`,
        userId: userId,
        name: 'Treino A - Peito e Tríceps',
        targetMuscles: ['Peito', 'Tríceps'],
        exercises: [
          { id: 'e1', name: 'Supino Inclinado Halteres', targetMuscle: 'Peito', defaultSets: 4, defaultReps: '8-10', defaultRestSeconds: 90 },
          { id: 'e2', name: 'Crucifixo Máquina', targetMuscle: 'Peito', defaultSets: 3, defaultReps: '12-15', defaultRestSeconds: 60 },
          { id: 'e3', name: 'Tríceps Corda', targetMuscle: 'Tríceps', defaultSets: 4, defaultReps: '10-12', defaultRestSeconds: 60 }
        ]
      },
      {
        id: `seed_${userId}_B`,
        userId: userId,
        name: 'Treino B - Costas e Bíceps',
        targetMuscles: ['Costas', 'Bíceps'],
        exercises: [
          { id: 'e4', name: 'Puxada Frente', targetMuscle: 'Costas', defaultSets: 4, defaultReps: '8-10', defaultRestSeconds: 90 },
          { id: 'e5', name: 'Remada Curvada', targetMuscle: 'Costas', defaultSets: 4, defaultReps: '8-10', defaultRestSeconds: 90 },
          { id: 'e6', name: 'Rosca Direta', targetMuscle: 'Bíceps', defaultSets: 3, defaultReps: '10-12', defaultRestSeconds: 60 }
        ]
      }
    ];
    const all = getRoutines();
    saveRoutines([...all, ...initialRoutines]);
  }
};
