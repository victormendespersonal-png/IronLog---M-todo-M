
import { Badge, UserBadge, WorkoutLog, User } from '../types';
import * as Storage from './storageService';

// --- Badge Definitions ---

export const BADGES: Badge[] = [
    // Consistency
    { id: 'c_rocket', name: 'Foguete Sem Freio', description: 'Realizou 3 treinos em uma única semana.', category: 'CONSISTENCY', tier: 'BRONZE', icon: 'Rocket', requirementValue: 3 },
    { id: 'c_monster', name: 'Monstro da Disciplina', description: 'Completou 12 treinos no mês.', category: 'CONSISTENCY', tier: 'SILVER', icon: 'CalendarCheck', requirementValue: 12 },
    { id: 'c_unstoppable', name: 'Imparável', description: 'Treinou por 3 meses sem falhar.', category: 'CONSISTENCY', tier: 'GOLD', icon: 'Flame', requirementValue: 90 },
    
    // Volume
    { id: 'v_million', name: 'Primeiro Milhão', description: 'Levantou mais de 1.000kg em um único treino.', category: 'VOLUME', tier: 'BRONZE', icon: 'Weight', requirementValue: 1000 },
    { id: 'v_sacred', name: 'Tonelada Sagrada', description: 'Acumulou 10.000kg de volume no mês.', category: 'VOLUME', tier: 'SILVER', icon: 'Mountain', requirementValue: 10000 },
    { id: 'v_giant', name: 'Gigante', description: 'Acumulou 100.000kg de volume total.', category: 'VOLUME', tier: 'DIAMOND', icon: 'Globe', requirementValue: 100000 },

    // Dedication
    { id: 'd_clock', name: 'Relógio Suíço', description: 'Seguiu o tempo de descanso sugerido em 10 treinos.', category: 'DEDICATION', tier: 'SILVER', icon: 'Watch', requirementValue: 10 },
];

// --- Logic ---

export const checkAchievements = (user: User, logs: WorkoutLog[]): { unlocked: Badge[], userBadges: UserBadge[] } => {
    if (!user || logs.length === 0) return { unlocked: [], userBadges: [] };

    const currentBadges = Storage.getUserBadges(user.id);
    const unlockedNow: Badge[] = [];
    
    // Convert current badges to map for easy update
    const badgeMap = new Map<string, UserBadge>();
    currentBadges.forEach(b => badgeMap.set(b.badgeId, b));
    BADGES.forEach(b => {
        if (!badgeMap.has(b.id)) {
            badgeMap.set(b.id, {
                userId: user.id,
                badgeId: b.id,
                earnedAt: 0,
                currentProgress: 0,
                isUnlocked: false
            });
        }
    });

    // 1. Check Consistency (Week)
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const workoutsThisWeek = logs.filter(l => new Date(l.startTime) >= startOfWeek).length;
    
    updateBadge(badgeMap, 'c_rocket', workoutsThisWeek, unlockedNow);

    // 2. Check Consistency (Month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const workoutsThisMonth = logs.filter(l => new Date(l.startTime) >= startOfMonth).length;
    
    updateBadge(badgeMap, 'c_monster', workoutsThisMonth, unlockedNow);

    // 3. Volume (Single Workout)
    const maxVolumeLog = Math.max(...logs.map(l => l.totalVolume || 0));
    updateBadge(badgeMap, 'v_million', maxVolumeLog, unlockedNow);

    // 4. Volume (Total)
    const totalVolume = logs.reduce((acc, l) => acc + (l.totalVolume || 0), 0);
    updateBadge(badgeMap, 'v_giant', totalVolume, unlockedNow);

    // 5. Volume (Month)
    const monthVolume = logs
        .filter(l => new Date(l.startTime) >= startOfMonth)
        .reduce((acc, l) => acc + (l.totalVolume || 0), 0);
    updateBadge(badgeMap, 'v_sacred', monthVolume, unlockedNow);


    // Save updates
    const updatedUserBadges = Array.from(badgeMap.values());
    Storage.saveUserBadges(updatedUserBadges);

    return { unlocked: unlockedNow, userBadges: updatedUserBadges };
};

const updateBadge = (map: Map<string, UserBadge>, badgeId: string, value: number, unlockedList: Badge[]) => {
    const userBadge = map.get(badgeId);
    const badgeDef = BADGES.find(b => b.id === badgeId);
    
    if (userBadge && badgeDef && !userBadge.isUnlocked) {
        userBadge.currentProgress = value;
        if (value >= badgeDef.requirementValue) {
            userBadge.isUnlocked = true;
            userBadge.earnedAt = Date.now();
            unlockedList.push(badgeDef);
        }
    }
};

export const getBadgeIconColor = (tier: string) => {
    switch(tier) {
        case 'BRONZE': return 'text-orange-700'; // Bronzeish
        case 'SILVER': return 'text-zinc-400';
        case 'GOLD': return 'text-metodo-gold';
        case 'DIAMOND': return 'text-cyan-400';
        default: return 'text-zinc-500';
    }
};
