
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { WorkoutRoutine, WorkoutLog, User } from '../types';

const COMPANY_COLOR = '#450a0a'; // Metodo Red
const SECONDARY_COLOR = '#d4af37'; // Metodo Gold

const addHeader = (doc: jsPDF, title: string, user: User) => {
    const width = doc.internal.pageSize.getWidth();
    
    // Background bar
    doc.setFillColor(COMPANY_COLOR);
    doc.rect(0, 0, width, 25, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("IRONLOG", 15, 17);
    
    // Subtitle / User
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Método M // Aluno: ${user.name}`, width - 15, 17, { align: 'right' });

    // Document Specific Title
    doc.setTextColor(69, 10, 10); // Red text
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, 40);
    
    // Line separator
    doc.setDrawColor(212, 175, 55); // Gold
    doc.setLineWidth(0.5);
    doc.line(15, 45, width - 15, 45);
};

export const exportRoutineToPdf = (routine: WorkoutRoutine, user: User) => {
    const doc = new jsPDF();
    
    addHeader(doc, `Ficha de Treino: ${routine.name}`, user);

    // Meta info
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Foco Muscular: ${routine.targetMuscles.join(', ')}`, 15, 55);
    doc.text(`Total de Exercícios: ${routine.exercises.length}`, 15, 62);

    // Table Data
    const tableData = routine.exercises.map(ex => [
        ex.name,
        ex.targetMuscle,
        `${ex.defaultSets} séries`,
        ex.defaultReps,
        ex.defaultRestSeconds ? `${ex.defaultRestSeconds}s` : '-',
        ex.notes || '-'
    ]);

    (doc as any).autoTable({
        startY: 70,
        head: [['Exercício', 'Músculo', 'Séries', 'Reps', 'Descanso', 'Obs']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: COMPANY_COLOR, textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { fontStyle: 'bold' },
            5: { fontStyle: 'italic', textColor: [100, 100, 100] }
        }
    });

    // Save
    doc.save(`Ficha_${routine.name.replace(/\s/g, '_')}.pdf`);
};

export const exportLogToPdf = (log: WorkoutLog, user: User) => {
    const doc = new jsPDF();
    const dateStr = new Date(log.startTime).toLocaleDateString('pt-BR');

    addHeader(doc, `Registro de Treino - ${dateStr}`, user);

    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Treino: ${log.routineName}`, 15, 55);
    if (log.totalDuration) doc.text(`Duração: ${log.totalDuration} min`, 15, 62);
    if (log.totalVolume) doc.text(`Volume Total: ${log.totalVolume} kg`, 100, 62);

    let currentY = 75;

    log.exercises.forEach((ex) => {
        // Exercise Header
        if (currentY > 270) { doc.addPage(); currentY = 20; } // Basic pagination check

        doc.setFillColor(240, 240, 240);
        doc.rect(15, currentY - 5, 180, 8, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(ex.exerciseName, 17, currentY);
        doc.setFont('helvetica', 'normal');
        
        currentY += 5;

        // Sets Table for this exercise
        const setsData = ex.sets.map((s, i) => [
            `#${i + 1}`,
            s.completed ? `${s.weight} kg` : '-',
            s.completed ? `${s.reps}` : '-',
            s.completed ? 'Feito' : 'Skipped'
        ]);

        (doc as any).autoTable({
            startY: currentY,
            head: [['Set', 'Carga', 'Reps', 'Status']],
            body: setsData,
            theme: 'plain',
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 1 },
            margin: { left: 15 },
            tableWidth: 100
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`Treino_${dateStr.replace(/\//g, '-')}.pdf`);
};

export const exportHistoryToPdf = (logs: WorkoutLog[], user: User) => {
    const doc = new jsPDF();
    const now = new Date();
    
    addHeader(doc, `Relatório de Histórico`, user);

    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Gerado em: ${now.toLocaleDateString()}`, 15, 55);
    doc.text(`Total de Treinos Listados: ${logs.length}`, 15, 62);

    const tableData = logs.map(log => [
        new Date(log.startTime).toLocaleDateString(),
        log.routineName,
        `${log.totalDuration || '-'} min`,
        `${log.totalVolume || '-'} kg`,
        log.exercises.length
    ]);

    (doc as any).autoTable({
        startY: 70,
        head: [['Data', 'Treino', 'Duração', 'Volume', 'Qtd Exer.']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: COMPANY_COLOR, textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 3 }
    });

    doc.save(`Historico_IronLog_${now.toISOString().split('T')[0]}.pdf`);
};
