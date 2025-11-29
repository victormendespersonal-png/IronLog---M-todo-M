
import { User, WorkoutLog } from '../types';

const NOTIFICATION_KEY = 'ironlog_last_notified';
const MONTHLY_REPORT_KEY = 'ironlog_monthly_report_notified';

export const requestPermission = async () => {
    if (!("Notification" in window)) return false;
    
    if (Notification.permission === 'granted') return true;
    
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return false;
};

export const getPeakWorkoutHour = (logs: WorkoutLog[]): number => {
    if (logs.length === 0) return 18; // Default to 6 PM if no data

    const hourCounts: Record<number, number> = {};
    
    // Only look at last 20 logs for relevance
    const recentLogs = logs.slice(0, 20);
    
    recentLogs.forEach(log => {
        const hour = new Date(log.startTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Find hour with max frequency
    let peakHour = 18;
    let maxCount = 0;
    
    Object.entries(hourCounts).forEach(([hour, count]) => {
        if (count > maxCount) {
            maxCount = count;
            peakHour = Number(hour);
        }
    });

    return peakHour;
};

const getMessage = (user: User, streak: number, daysInactive: number): string => {
    const firstName = user.name.split(' ')[0];

    // Scenario 1: High Inactivity
    if (daysInactive >= 3) {
        return `${firstName}, seu corpo sente falta do ferro! Volte para o jogo hoje!`;
    }

    // Scenario 2: High Streak
    if (streak >= 3) {
        return `${firstName}, você está pegando fogo! 🔥 Mantenha o ritmo de monstro!`;
    }

    // Scenario 3: Routine/Standard
    const messages = [
        `${firstName}, hora de virar monstro hoje! 💪`,
        `O treino te chama, campeão. Não deixe para depois.`,
        `Seu corpo agradece! Bora pra cima, ${firstName}!`,
        `A dor é temporária, a glória é eterna. Vamos treinar?`,
        `Hoje é dia de bater recorde, ${firstName}. Foco total!`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
};

export const checkMonthlyReportNotification = (user: User, logs: WorkoutLog[]) => {
    if (!user.preferences?.enabled) return;
    if (!("Notification" in window)) return;
    
    const now = new Date();
    // Only notify in the first 5 days of a new month
    if (now.getDate() > 5) return;

    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const lastNotifiedMonth = localStorage.getItem(MONTHLY_REPORT_KEY);

    if (lastNotifiedMonth === currentMonthKey) return;

    // Ensure we have data from previous month
    const prevMonthLogs = logs.filter(l => {
        const d = new Date(l.startTime);
        return d.getMonth() === (now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1);
    });

    if (prevMonthLogs.length > 0 && Notification.permission === 'granted') {
        new Notification("Relatório Mensal Disponível", {
            body: `Seu relatório de ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} está pronto! Veja sua evolução.`,
            icon: "/favicon.ico"
        });
        localStorage.setItem(MONTHLY_REPORT_KEY, currentMonthKey);
    }
};

export const checkForNotification = (user: User, logs: WorkoutLog[]) => {
    if (!user.preferences?.enabled) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== 'granted') return;

    // Check Monthly Report
    checkMonthlyReportNotification(user, logs);

    // Check if already notified today
    const lastNotified = localStorage.getItem(NOTIFICATION_KEY);
    const today = new Date().toDateString();
    
    if (lastNotified === today) return;

    // Calculate Context
    const now = new Date();
    const currentHour = now.getHours();
    
    // Have they worked out today already?
    const workoutToday = logs.some(l => new Date(l.startTime).toDateString() === today);
    if (workoutToday) return;

    // Determine target hour
    const peakHour = getPeakWorkoutHour(logs);
    
    // Trigger window: 1 hour before up to the peak hour
    if (currentHour >= peakHour - 1 && currentHour <= peakHour) {
        
        // Calculate Stats for Message
        const sortedLogs = [...logs].sort((a,b) => b.startTime - a.startTime);
        const lastWorkout = sortedLogs[0] ? new Date(sortedLogs[0].startTime) : new Date(0);
        const daysInactive = Math.floor((now.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));
        
        // Simple streak calc
        let streak = 0;
        // (Simplified streak logic for message purposes)
        
        const msg = getMessage(user, streak, daysInactive);
        
        // Send Notification
        new Notification("IronLog - Método M", {
            body: msg,
            icon: "/favicon.ico", // Assuming standard icon or none
            badge: "/favicon.ico"
        });

        // Mark as notified today
        localStorage.setItem(NOTIFICATION_KEY, today);
    }
};
