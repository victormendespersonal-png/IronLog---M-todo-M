
import { GoogleGenAI } from "@google/genai";
import { WorkoutLog, UserGoal, UserLevel, WorkoutRoutine, MonthlyComparison } from '../types';

export const analyzeProgress = async (logs: WorkoutLog[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key indisponível. Por favor, configure a chave de API.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format logs for the prompt, taking only the last 5 for context to save tokens/complexity
  const recentLogs = logs.slice(0, 5).map(log => {
    return `
    Data: ${new Date(log.startTime).toLocaleDateString()}
    Treino: ${log.routineName}
    Exercícios:
    ${log.exercises.map(ex => 
      `- ${ex.exerciseName}: ${ex.sets.filter(s => s.completed).length} séries (Cargas: ${ex.sets.map(s => s.weight + 'kg').join(', ')})`
    ).join('\n')}
    `;
  }).join('\n---\n');

  const prompt = `
  Você é um treinador de elite especialista em musculação, focado em hipertrofia e alta intensidade (similar ao Método M).
  Analise os seguintes registros recentes de treino do aluno:

  ${recentLogs}

  Forneça uma análise curta e direta (máximo 300 palavras) em formato de tópicos:
  1. Identifique um ponto forte ou consistência.
  2. Identifique uma oportunidade de melhoria (ex: progressão de carga estagnada, volume baixo).
  3. Dê uma dica motivacional agressiva no estilo "No Pain No Gain".

  Use formatação Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com a IA. Tente novamente mais tarde.";
  }
};

export const generateMonthlyReport = async (stats: MonthlyComparison): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key indisponível");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
    Atue como um coach de musculação exigente. Gere um Relatório Mensal comparando o Mês Atual (${stats.current.monthName}) com o Mês Anterior (${stats.previous.monthName}).

    DADOS:
    - Volume Total: ${stats.current.totalVolume}kg (${stats.volumeDeltaPercent > 0 ? '+' : ''}${stats.volumeDeltaPercent}%)
    - Frequência: ${stats.current.totalWorkouts} treinos (${stats.frequencyDeltaPercent > 0 ? '+' : ''}${stats.frequencyDeltaPercent}%)
    - Melhores Cargas do Mês: ${stats.bestExercises.map(e => `${e.name}: ${e.weight}kg`).join(', ')}

    INSTRUÇÕES:
    1. Seja breve (max 150 palavras).
    2. Analise se o aluno evoluiu ou regrediu.
    3. Se o volume ou frequência caiu, dê uma bronca motivacional.
    4. Se subiu, parabenize mas exija mais.
    5. Cite os melhores exercícios como destaque.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "Sem análise disponível.";
    } catch (e) {
        return "Erro ao gerar relatório mensal.";
    }
};

export const generateWeeklyPlan = async (
  goal: UserGoal, 
  level: UserLevel, 
  daysPerWeek: number, 
  logs: WorkoutLog[]
): Promise<Partial<WorkoutRoutine>[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key indisponível.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Extract recent weights to calibrate suggestions
    const recentStats = logs.slice(0, 10).map(l => 
        l.exercises.map(e => `${e.exerciseName} (Max: ${Math.max(...e.sets.map(s=>s.weight))}kg)`).join(', ')
    ).join('; ');

    const prompt = `
    Atue como um treinador de musculação de elite.
    Crie uma rotina semanal completa de treino.
    
    PERFIL DO ALUNO:
    - Objetivo: ${goal} (Tradução: HYPERTROPHY=Hipertrofia, STRENGTH=Força, DEFINITION=Definição/Cutting, REHAB=Reabilitação)
    - Nível: ${level}
    - Frequência: ${daysPerWeek} dias por semana.
    - Histórico recente (cargas): ${recentStats}

    REQUISITOS:
    1. Crie ${daysPerWeek} fichas de treino (divisão lógica como ABC, ABCD, Full Body, etc).
    2. Para cada ficha, sugira 5 a 8 exercícios.
    3. Defina séries, repetições (ex: "8-12", "6-8", "15+") e descanso (segundos) baseados no objetivo.
    4. RESPOND EM JSON PURO. Não use Markdown, não use explicações. Apenas o JSON.

    ESTRUTURA JSON ESPERADA (Array de objetos):
    [
      {
        "name": "Nome do Treino (ex: Treino A - Peito)",
        "targetMuscles": ["Peito", "Tríceps"],
        "exercises": [
          {
            "name": "Supino Reto",
            "targetMuscle": "Peito",
            "defaultSets": 4,
            "defaultReps": "8-10",
            "defaultRestSeconds": 90,
            "notes": "Foque na excêntrica"
          }
        ]
      }
    ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) throw new Error("Sem resposta da IA");
        
        // Clean markdown if present (though responseMimeType should handle it)
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);

    } catch (error) {
        console.error("Plan Generation Error:", error);
        throw new Error("Falha ao gerar treino. Tente novamente.");
    }
};
