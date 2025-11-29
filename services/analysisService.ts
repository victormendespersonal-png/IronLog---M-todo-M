
import { WorkoutLog, WorkoutRoutine, AiRecommendation, ExerciseSession, MonthlyComparison, MonthlyStats, WorkoutPerformanceReport } from '../types';

export const generateRecommendations = (
    routine: WorkoutRoutine, 
    history: WorkoutLog[]
): Record<string, AiRecommendation> => {
    const recommendations: Record<string, AiRecommendation> = {};

    // Sort history by date desc
    const sortedHistory = [...history].sort((a, b) => b.startTime - a.startTime);

    routine.exercises.forEach(routineEx => {
        // Find last session for this exercise
        let lastSession: ExerciseSession | null = null;
        let lastLogDate = 0;

        for (const log of sortedHistory) {
            const exSession = log.exercises.find(e => e.exerciseName === routineEx.name); // Match by name to span routines
            if (exSession) {
                lastSession = exSession;
                lastLogDate = log.startTime;
                break;
            }
        }

        if (!lastSession) {
            recommendations[routineEx.id] = {
                exerciseId: routineEx.id,
                suggestedWeight: routineEx.defaultWeight || 0,
                action: 'NEW',
                reasoning: 'Primeira vez realizando este exercício. Defina uma carga base.'
            };
            return;
        }

        // --- Logic Core ---
        
        // 1. Analyze performance of last session
        const sets = lastSession.sets.filter(s => s.completed);
        if (sets.length === 0) return;

        const lastWeight = Math.max(...sets.map(s => s.weight));
        const totalReps = sets.reduce((acc, s) => acc + s.reps, 0);
        const avgReps = totalReps / sets.length;
        
        // Parse target reps (e.g., "8-12" -> max 12)
        const targetRepsHigh = parseInt(routineEx.defaultReps.split('-')[1] || routineEx.defaultReps);
        
        let action: 'INCREASE' | 'MAINTAIN' | 'DECREASE' = 'MAINTAIN';
        let suggestedWeight = lastWeight;
        let reasoning = '';

        // If completed all sets with high reps -> Increase
        if (avgReps >= targetRepsHigh) {
            action = 'INCREASE';
            suggestedWeight = Math.ceil((lastWeight * 1.05) / 1) * 1; // +5% round to nearest 1kg
            if (suggestedWeight === lastWeight) suggestedWeight += 2; // Min increase
            reasoning = `Você completou todas as séries com facilidade no último treino (${lastWeight}kg). A IA sugere aumentar a carga.`;
        } 
        // If struggled (avg reps < bottom of range - 2)
        else if (avgReps < (targetRepsHigh - 4)) {
            action = 'DECREASE';
            suggestedWeight = Math.floor((lastWeight * 0.95) / 1) * 1;
            reasoning = `Houve falha excessiva no último treino. Reduzir carga para recuperar a técnica.`;
        } 
        else {
            reasoning = `Mantenha a carga de ${lastWeight}kg para consolidar a execução nas repetições alvo.`;
        }

        // 2. Stagnation Detection
        // Check last 3 sessions for same exercise
        let stagnationWarning = false;
        let stagnationCount = 0;
        
        // Look back up to 3 logs
        let previousWeights: number[] = [];
        for (const log of sortedHistory.slice(0, 4)) {
            const ex = log.exercises.find(e => e.exerciseName === routineEx.name);
            if (ex) {
                const maxW = Math.max(...ex.sets.filter(s=>s.completed).map(s=>s.weight), 0);
                if (maxW > 0) previousWeights.push(maxW);
            }
        }

        // If we have 3 data points and weight hasn't changed or decreased
        if (previousWeights.length >= 3) {
            const [w1, w2, w3] = previousWeights; // w1 is latest
            if (w1 <= w2 && w2 <= w3) {
                stagnationWarning = true;
                reasoning = "⚠️ IA detectou estagnação. Recomendação: Aumentar tempo de descanso ou variar repetições.";
            }
        }

        recommendations[routineEx.id] = {
            exerciseId: routineEx.id,
            suggestedWeight,
            action,
            reasoning,
            stagnationWarning,
            suggestedRest: stagnationWarning ? (routineEx.defaultRestSeconds || 60) + 30 : undefined
        };
    });

    return recommendations;
};

export const getWeeklyReport = (logs: WorkoutLog[]) => {
    // Helper to generate simple stats for the UI
    const totalVolume = logs.reduce((acc, l) => acc + (l.totalVolume || 0), 0);
    const uniqueMuscles = new Set<string>();
    logs.forEach(l => l.exercises.forEach(e => {
        if(e.targetMuscle) uniqueMuscles.add(e.targetMuscle);
    }));

    return {
        volume: totalVolume,
        workouts: logs.length,
        muscles: uniqueMuscles.size
    };
};

// --- Monthly Comparison ---

export const getMonthlyComparison = (logs: WorkoutLog[]): MonthlyComparison => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Determine previous month
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear = currentYear - 1;
    }

    // Filter Logs
    const currentLogs = logs.filter(l => {
        const d = new Date(l.startTime);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const prevLogs = logs.filter(l => {
        const d = new Date(l.startTime);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    // Helper to calc stats
    const calcStats = (monthLogs: WorkoutLog[], name: string): MonthlyStats => {
        const vol = monthLogs.reduce((acc, l) => acc + (l.totalVolume || 0), 0);
        return {
            monthName: name,
            totalVolume: vol,
            totalWorkouts: monthLogs.length,
            avgVolumePerWorkout: monthLogs.length > 0 ? Math.round(vol / monthLogs.length) : 0
        };
    };

    const currentStats = calcStats(
        currentLogs, 
        now.toLocaleDateString('pt-BR', { month: 'long' })
    );
    
    const prevDate = new Date();
    prevDate.setMonth(prevMonth);
    const prevStats = calcStats(
        prevLogs, 
        prevDate.toLocaleDateString('pt-BR', { month: 'long' })
    );

    // Calculate Deltas
    const getDelta = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
    };

    // Find Best Exercises (by heaviest lift in current month)
    const exerciseBests: Record<string, { weight: number, muscle: string }> = {};
    currentLogs.forEach(l => {
        l.exercises.forEach(ex => {
            const maxW = Math.max(...ex.sets.filter(s=>s.completed).map(s=>s.weight), 0);
            if (!exerciseBests[ex.exerciseName] || maxW > exerciseBests[ex.exerciseName].weight) {
                exerciseBests[ex.exerciseName] = { weight: maxW, muscle: ex.targetMuscle || '' };
            }
        });
    });

    const bestExercises = Object.entries(exerciseBests)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a,b) => b.weight - a.weight)
        .slice(0, 3);

    return {
        current: currentStats,
        previous: prevStats,
        volumeDeltaPercent: getDelta(currentStats.totalVolume, prevStats.totalVolume),
        frequencyDeltaPercent: getDelta(currentStats.totalWorkouts, prevStats.totalWorkouts),
        bestExercises
    };
};

// --- Advanced Charts Aggregators ---

export const getVolumeHistory = (logs: WorkoutLog[], period: 'WEEK' | 'MONTH') => {
    const data: Record<string, number> = {};
    
    // Sort logs chronologically
    const sortedLogs = [...logs].sort((a, b) => a.startTime - b.startTime);

    sortedLogs.forEach(log => {
        const date = new Date(log.startTime);
        let key = '';

        if (period === 'WEEK') {
            // Get week number
            const startOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDays = (date.getTime() - startOfYear.getTime()) / 86400000;
            const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
            key = `S${weekNum}`; // Shortened for mobile charts
        } else {
            // Month/Year
            key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        }

        const vol = log.totalVolume || 0;
        data[key] = (data[key] || 0) + vol;
    });

    // Convert to array
    return Object.entries(data).map(([name, value]) => ({ 
        name, 
        value: Math.round(value / 1000) // Return in Tonnes for better UI scaling
    }));
};

export const getMuscleBalance = (logs: WorkoutLog[]) => {
    const counts: Record<string, number> = {};
    let max = 0;

    logs.forEach(log => {
        log.exercises.forEach(ex => {
            const muscle = ex.targetMuscle || 'Outros';
            // Count Sets as volume metric for muscle
            const sets = ex.sets.filter(s => s.completed).length;
            counts[muscle] = (counts[muscle] || 0) + sets;
        });
    });

    // Get top 6 muscles to keep Radar chart clean
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 6);
    if (sorted.length > 0) max = sorted[0][1];

    return sorted.map(([muscle, count]) => ({
        subject: muscle,
        A: count,
        fullMark: max // Used for scaling
    }));
};

export const getPersonalRecords = (logs: WorkoutLog[]) => {
    const records: Record<string, { weight: number, date: number }> = {};

    logs.forEach(log => {
        log.exercises.forEach(ex => {
            const maxWeight = Math.max(...ex.sets.filter(s=>s.completed).map(s=>s.weight), 0);
            if (maxWeight > 0) {
                if (!records[ex.exerciseName] || maxWeight > records[ex.exerciseName].weight) {
                    records[ex.exerciseName] = { weight: maxWeight, date: log.startTime };
                }
            }
        });
    });

    // Convert to array and take top 4 most impressive (highest weight usually correlates to big compounds)
    return Object.entries(records)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a,b) => b.weight - a.weight)
        .slice(0, 4);
};

// --- Post-Workout AI Comparison ---

export const compareWorkoutPerformance = (currentLog: WorkoutLog, allLogs: WorkoutLog[]): WorkoutPerformanceReport => {
    // 1. Find the last workout with same Routine Name OR matching muscles
    // Filter out the current log if it's already in the list
    const history = allLogs.filter(l => l.id !== currentLog.id).sort((a,b) => b.startTime - a.startTime);
    
    let comparisonLog = history.find(l => l.routineName === currentLog.routineName);
    
    // If no direct routine match, try finding one with muscle overlap
    if (!comparisonLog && currentLog.exercises.length > 0) {
        const targetMuscles = new Set(currentLog.exercises.map(e => e.targetMuscle));
        comparisonLog = history.find(l => l.exercises.some(e => targetMuscles.has(e.targetMuscle)));
    }

    if (!comparisonLog) {
        return {
            volumeDelta: 100,
            loadDelta: 0,
            durationDelta: 0,
            volumeDiffValue: currentLog.totalVolume || 0,
            message: "Primeira vez realizando este treino! Você estabeleceu o padrão para o futuro.",
            highlight: 'POSITIVE'
        };
    }

    // 2. Calculate Stats
    const currVol = currentLog.totalVolume || 0;
    const prevVol = comparisonLog.totalVolume || 0;
    const volumeDelta = prevVol === 0 ? 100 : Math.round(((currVol - prevVol) / prevVol) * 100);
    const volumeDiffValue = currVol - prevVol;

    // Intensity (Avg Weight of completed sets)
    const getAvgWeight = (log: WorkoutLog) => {
        let totalW = 0, count = 0;
        log.exercises.forEach(ex => ex.sets.forEach(s => {
            if (s.completed && s.weight > 0) {
                totalW += s.weight;
                count++;
            }
        }));
        return count === 0 ? 0 : totalW / count;
    };
    
    const currInt = getAvgWeight(currentLog);
    const prevInt = getAvgWeight(comparisonLog);
    const loadDelta = prevInt === 0 ? 0 : Math.round(((currInt - prevInt) / prevInt) * 100);

    // Duration
    const currDur = currentLog.totalDuration || 1;
    const prevDur = comparisonLog.totalDuration || 1;
    const durationDelta = Math.round(((currDur - prevDur) / prevDur) * 100);

    // 3. Generate Message
    let message = "";
    let highlight: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';

    if (volumeDelta > 5) {
        message = `Hoje você rendeu ${volumeDelta}% melhor do que seu último treino similar! Você levantou ${volumeDiffValue}kg a mais.`;
        highlight = 'POSITIVE';
    } else if (volumeDelta < -10) {
        message = `Seu volume total caiu ${Math.abs(volumeDelta)}% comparado ao último treino. Foco na recuperação para a próxima.`;
        highlight = 'NEGATIVE';
    } else if (loadDelta > 2) {
        message = `Sua intensidade média subiu ${loadDelta}%. Você está ficando mais forte!`;
        highlight = 'POSITIVE';
    } else {
        message = `Desempenho consistente. Você manteve o volume e a intensidade estáveis.`;
        highlight = 'NEUTRAL';
    }

    return {
        volumeDelta,
        loadDelta,
        durationDelta,
        volumeDiffValue,
        message,
        highlight
    };
};
