/* js/ui/render.js */
import { BoardManager, BOARD_CONFIG } from '../modules/board.js';
import { EpicManager } from '../modules/epics.js';
import { openTaskModal } from './modal.js';

export const Render = {
    
    async renderBoard() {
        const container = document.getElementById('board-view');
        container.innerHTML = ''; // Limpiar lienzo

        // 1. Obtener datos frescos
        const columnsData = await BoardManager.getBoardData();
        const epicsMap = await EpicManager.getMap(); // Para pintar colores/nombres de épicas

        // 2. Generar Columnas Dinámicamente
        BOARD_CONFIG.forEach(colConfig => {
            const tasks = columnsData[colConfig.id] || [];
            const colHTML = this.createColumnHTML(colConfig, tasks.length);
            
            // Convertir string a nodo DOM para adjuntar eventos
            const colDiv = document.createRange().createContextualFragment(colHTML).firstElementChild;
            const taskList = colDiv.querySelector('.task-list');

            // 3. Pintar Tarjetas dentro de la columna
            tasks.forEach(task => {
                const card = this.createCardDOM(task, epicsMap);
                taskList.appendChild(card);
            });

            // 4. ACTIVAR DRAG & DROP (EL FIX)
            this.setupDropZone(taskList, colConfig.id);

            container.appendChild(colDiv);
        });
    },

    createColumnHTML(config, count) {
        return `
            <div class="column">
                <div class="column-header">
                    <span>${config.title}</span>
                    <span>[${count}]</span>
                </div>
                <div class="task-list" id="col-${config.id}">
                    <!-- Cards injected here -->
                </div>
            </div>
        `;
    },

    createCardDOM(task, epicsMap) {
        const div = document.createElement('div');
        div.className = 'task-card';
        div.draggable = true;
        div.dataset.id = task.id;

        // Datos de la Épica (si existe)
        let epicBadge = '';
        if (task.epicId && epicsMap[task.epicId]) {
            const epic = epicsMap[task.epicId];
            epicBadge = `<span class="epic-pill" style="border-left: 4px solid ${epic.color}">${epic.title}</span>`;
        }

        div.innerHTML = `
            ${epicBadge}
            <div class="card-title">${task.title}</div>
            <div class="card-meta">
                <span>DUE: ${task.dueDate || 'N/A'}</span>
                ${task.links && task.links.length > 0 ? '<span>📎 LINKS</span>' : ''}
            </div>
        `;

        // Evento Click: Abrir Modal
        div.addEventListener('click', () => openTaskModal(task.id));

        // Evento Drag Start
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            e.target.classList.add('dragging');
        });

        div.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });

        return div;
    },

    // LA LÓGICA DE DROP SÓLIDA
    setupDropZone(listElement, statusId) {
        listElement.addEventListener('dragover', (e) => {
            e.preventDefault(); // OBLIGATORIO para permitir drop
            listElement.classList.add('drag-over');
        });

        listElement.addEventListener('dragleave', () => {
            listElement.classList.remove('drag-over');
        });

        listElement.addEventListener('drop', async (e) => {
            e.preventDefault();
            listElement.classList.remove('drag-over');
            
            const taskId = e.dataTransfer.getData('text/plain');
            
            // Si el ID es numérico (legacy), convertirlo. Si es string, dejarlo.
            // La comparación en BoardManager maneja esto, pero aseguramos.
            const safeId = isNaN(taskId) ? taskId : Number(taskId);

            const changed = await BoardManager.updateTaskStatus(safeId, statusId);
            if (changed) {
                this.renderBoard(); // Re-render completo para actualizar contadores y orden
            }
        });
    }
};
