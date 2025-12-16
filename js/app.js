import { db } from './db.js';

// --- ESTADO DE LA APLICACIÓN ---
let draggedTaskId = null; // Para saber qué tarjeta estamos arrastrando

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.open(); // Abrimos la base de datos
        renderBoard();   // Pintamos las tareas guardadas
        setupEventListeners(); // Activamos botones y drag & drop
    } catch (error) {
        console.error("Error iniciando la app:", error);
        alert("Hubo un error cargando la base de datos local.");
    }
});

// --- RENDERIZADO DEL TABLERO (Pintar las tarjetas) ---
async function renderBoard() {
    const tasks = await db.getAllTasks();
    
    // Limpiamos las columnas para volver a pintar
    const columns = {
        todo: document.getElementById('todo-list'),
        inprogress: document.getElementById('inprogress-list'),
        done: document.getElementById('done-list')
    };

    // Contadores a 0
    const counts = { todo: 0, inprogress: 0, done: 0 };
    Object.values(columns).forEach(col => col.innerHTML = '');

    // Generamos cada tarjeta
    tasks.forEach(task => {
        if (columns[task.status]) {
            const card = createTaskElement(task);
            columns[task.status].appendChild(card);
            counts[task.status]++;
        }
    });

    // Actualizamos los numeritos de los contadores
    document.getElementById('count-todo').textContent = counts.todo;
    document.getElementById('count-inprogress').textContent = counts.inprogress;
    document.getElementById('count-done').textContent = counts.done;
}

// Crea el HTML de una tarjeta individual
function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.draggable = true; // ¡Permite arrastrar!
    div.dataset.id = task.id; // Guardamos el ID oculto en el div

    // Formatear fecha (Ej: 12 oct)
    const date = new Date(task.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    div.innerHTML = `
        <div class="card-header">
            <span class="tag ${task.tag}">${getTagLabel(task.tag)}</span>
            <!-- Icono de editar pequeñito -->
        </div>
        <div class="task-title">${task.title}</div>
        <div class="card-footer">
            <span class="priority-dot priority-${task.priority}" title="Prioridad"></span>
            <span class="date">${date}</span>
        </div>
    `;

    // Evento: Al hacer clic, abrir modal para editar
    div.addEventListener('click', () => openModal(task));

    // Eventos Drag & Drop nativos
    div.addEventListener('dragstart', (e) => {
        draggedTaskId = task.id;
        e.target.classList.add('dragging'); // Añade estilo visual
    });

    div.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        draggedTaskId = null;
    });

    return div;
}

// --- GESTIÓN DEL MODAL (Formulario) ---
const modal = document.getElementById('task-modal');
const form = document.getElementById('task-form');
const btnDelete = document.getElementById('btn-delete-task');

function openModal(task = null) {
    modal.classList.remove('hidden');
    
    if (task) {
        // Modo Edición
        document.getElementById('modal-title').textContent = "Editar Tarea";
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-tag').value = task.tag;
        document.getElementById('task-priority').value = task.priority;
        btnDelete.classList.remove('hidden'); // Mostrar botón borrar
    } else {
        // Modo Creación
        document.getElementById('modal-title').textContent = "Nueva Tarea";
        form.reset();
        document.getElementById('task-id').value = ''; // ID vacío = nuevo
        btnDelete.classList.add('hidden'); // Ocultar botón borrar
    }
}

function closeModal() {
    modal.classList.add('hidden');
}

// --- LOGICA DE EVENTOS GENERALES ---
function setupEventListeners() {
    // 1. Botón "Nueva Tarea"
    document.getElementById('btn-add-task').addEventListener('click', () => openModal());

    // 2. Botón cerrar modal
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);

    // 3. Guardar formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('task-id').value;
        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-desc').value,
            tag: document.getElementById('task-tag').value,
            priority: document.getElementById('task-priority').value,
            status: id ? undefined : 'todo' // Si es nueva, va a "Por hacer"
        };

        // Si existe ID, lo mantenemos y preservamos el estado actual
        if (id) {
            const oldTask = (await db.getAllTasks()).find(t => t.id === Number(id));
            taskData.id = Number(id);
            taskData.status = oldTask.status; // Mantener columna
            taskData.createdAt = oldTask.createdAt;
        } else {
            taskData.id = Date.now(); // ID único basado en timestamp
        }

        await db.saveTask(taskData);
        closeModal();
        renderBoard(); // Refrescar tablero
    });

    // 4. Borrar tarea
    btnDelete.addEventListener('click', async () => {
        const id = Number(document.getElementById('task-id').value);
        if (confirm('¿Seguro que quieres borrar esta tarea?')) {
            await db.deleteTask(id);
            closeModal();
            renderBoard();
        }
    });

    // 5. Configurar zonas de "Drop" (Las columnas)
    document.querySelectorAll('.column .task-list').forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necesario para permitir soltar
        });

        list.addEventListener('drop', async (e) => {
            e.preventDefault();
            const columnDiv = list.closest('.column');
            const newStatus = columnDiv.dataset.status;

            if (draggedTaskId) {
                // Recuperar tarea, cambiar estado y guardar
                const tasks = await db.getAllTasks();
                const task = tasks.find(t => t.id === draggedTaskId);
                if (task && task.status !== newStatus) {
                    task.status = newStatus;
                    await db.saveTask(task);
                    renderBoard();
                }
            }
        });
    });

    // 6. Botón Snapshot (Foto del tablero)
    document.getElementById('btn-snapshot').addEventListener('click', () => {
        const board = document.getElementById('board-container');
        html2canvas(board).then(canvas => {
            const link = document.createElement('a');
            link.download = `jira-lite-snapshot-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    });

    // 7. Botón Exportar JSON (Backup / Logs)
    document.getElementById('btn-export').addEventListener('click', async () => {
        const data = await db.exportData();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `jira-lite-backup-${Date.now()}.json`;
        link.click();
    });
}

// Helper para nombres bonitos
function getTagLabel(tag) {
    const labels = { ux: 'UX Research', ui: 'UI Design', dev: 'Dev', doc: 'Docs' };
    return labels[tag] || tag;
}
