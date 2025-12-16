/* js/modules/board.js */
import { db } from '../core/db.js';

// CONFIGURACIÓN CENTRAL DEL TABLERO
// Si quieres añadir una columna "Bloqueado", la pones aquí y listo.
export const BOARD_CONFIG = [
    { id: 'todo', title: '01_POR_HACER' },
    { id: 'inprogress', title: '02_EN_CURSO' },
    { id: 'review', title: '03_EN_REVISIÓN' }, // ¡Nueva columna profesional!
    { id: 'done', title: '04_HECHO' }
];

export const BoardManager = {
    
    // Obtener tareas agrupadas por columna
    async getBoardData() {
        const tasks = await db.getAll('tasks');
        const cols = {};
        
        // Inicializar columnas vacías
        BOARD_CONFIG.forEach(c => cols[c.id] = []);

        // Distribuir tareas
        tasks.forEach(task => {
            // Si la tarea tiene un status raro (legacy), la mandamos a 'todo'
            const status = cols[task.status] ? task.status : 'todo';
            cols[status].push(task);
        });

        return cols;
    },

    // Mover tarea (Logic Only)
    async updateTaskStatus(taskId, newStatus) {
        // Validar que el status existe
        if (!BOARD_CONFIG.find(c => c.id === newStatus)) {
            console.error(`STATUS_INVALID: ${newStatus}`);
            return;
        }

        // 1. Obtener tarea
        const tasks = await db.getAll('tasks');
        const task = tasks.find(t => t.id === taskId);
        
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            await db.save('tasks', task);
            console.log(`%c [MOVED] ${task.title} -> ${newStatus} `, 'color: #ccff00');
            return true; // Signal to re-render
        }
        return false;
    }
};
