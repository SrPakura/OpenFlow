/* js/modules/epics.js */
import { db } from '../core/db.js';

// Colores permitidos (Paleta Industrial)
const INDUSTRIAL_COLORS = [
    '#ccff00', // Acid
    '#ff4d00', // Safety Orange
    '#00ccff', // Cyan
    '#ff00ff', // Magenta
    '#ffffff', // White
    '#b0b0b0'  // Concrete
];

export const EpicManager = {
    
    async getAll() {
        return await db.getAll('epics');
    },

    async create(title) {
        const id = 'EPIC_' + Date.now();
        // Elegir color aleatorio de la paleta permitida
        const color = INDUSTRIAL_COLORS[Math.floor(Math.random() * INDUSTRIAL_COLORS.length)];
        
        const epic = { id, title, color };
        await db.save('epics', epic);
        return epic;
    },

    async delete(id) {
        // OJO: Si borras una épica, las tareas se quedan huérfanas (epicId: "")
        // Eso es comportamiento deseado para no perder datos.
        await db.delete('epics', id);
    },

    // Helper para pintar la UI
    async getMap() {
        const epics = await this.getAll();
        const map = {}; // Diccionario id -> {title, color}
        epics.forEach(e => map[e.id] = e);
        return map;
    }
};
