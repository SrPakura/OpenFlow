/* js/ui/modal.js */
import { db } from '../core/db.js';
import { Render } from './render.js';
import { EpicManager } from '../modules/epics.js';

const overlay = document.getElementById('modal-overlay');
const title = document.getElementById('modal-title');
const body = document.getElementById('modal-body');
const closeBtn = document.getElementById('btn-close-modal');

// Cerrar modal globalmente
closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

// --- MODAL DE TAREA ---
export async function openTaskModal(taskId = null) {
    overlay.classList.remove('hidden');
    let task = {};
    
    // Cargar datos si es edición
    if (taskId) {
        title.textContent = "EDITAR TAREA // " + taskId; // Cambiado de "EDIT_PROTOCOL // "
        const tasks = await db.getAll('tasks');
        task = tasks.find(t => t.id == taskId) || {};
    } else {
        title.textContent = "NUEVA TAREA // REGISTRO"; // Cambiado de "INIT_PROTOCOL // NEW_TASK"
    }

    // Preparar Select de Fases (Épicas)
    const epics = await EpicManager.getAll();
    const epicOptions = epics.map(e => 
        `<option value="${e.id}" ${task.epicId === e.id ? 'selected' : ''}>${e.title}</option>`
    ).join('');

    // Renderizar Formulario Traducido
    body.innerHTML = `
        <form id="task-form">
            <label>TÍTULO DE LA TAREA</label>
            <input type="text" id="inp-title" value="${task.title || ''}" required placeholder="Ej: Redactar introducción...">
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div>
                    <label>FECHA INICIO</label>
                    <input type="date" id="inp-start" value="${task.startDate || new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label>FECHA LÍMITE</label>
                    <input type="date" id="inp-due" value="${task.dueDate || new Date().toISOString().split('T')[0]}">
                </div>
            </div>

            <label>ASIGNAR FASE (ÉPICA)</label>
            <select id="inp-epic">
                <option value="">-- SIN ASIGNAR --</option>
                ${epicOptions}
            </select>

            <label>RECURSOS Y ENLACES</label>
            <div id="links-container"></div>
            <button type="button" id="btn-add-link" class="btn btn-outline" style="width:100%; margin-bottom: 20px;">+ AÑADIR ENLACE</button>

            <div style="display:flex; gap:10px; justify-content:flex-end; border-top: 2px solid #000; padding-top:20px;">
                ${taskId ? `<button type="button" id="btn-delete" class="btn btn-text" style="color:var(--alert)">ELIMINAR</button>` : ''}
                <button type="submit" class="btn btn-acid">GUARDAR CAMBIOS</button>
            </div>
        </form>
    `;

    // Lógica de Links (Repeater)
    const linksContainer = document.getElementById('links-container');
    const existingLinks = task.links || [];
    
    const addLinkRow = (name = '', url = '') => {
        const row = document.createElement('div');
        row.className = 'link-row';
        row.innerHTML = `
            <input type="text" placeholder="Nombre (ej: Drive)" class="link-name" value="${name}" style="flex:1">
            <input type="url" placeholder="https://..." class="link-url" value="${url}" style="flex:2">
            <button type="button" class="btn-remove-link btn btn-solid">X</button>
        `;
        row.querySelector('.btn-remove-link').onclick = () => row.remove();
        linksContainer.appendChild(row);
    };

    // Cargar links existentes o uno vacío
    if (existingLinks.length > 0) existingLinks.forEach(l => addLinkRow(l.name, l.url));
    else addLinkRow();

    document.getElementById('btn-add-link').onclick = () => addLinkRow();

    // Guardar
    document.getElementById('task-form').onsubmit = async (e) => {
        e.preventDefault();
        
        // Recoger Links
        const links = [];
        document.querySelectorAll('.link-row').forEach(row => {
            const name = row.querySelector('.link-name').value;
            const url = row.querySelector('.link-url').value;
            if (name && url) links.push({ name, url });
        });

        const newTask = {
            id: taskId || Date.now(),
            title: document.getElementById('inp-title').value,
            startDate: document.getElementById('inp-start').value,
            dueDate: document.getElementById('inp-due').value,
            epicId: document.getElementById('inp-epic').value,
            status: task.status || 'todo', // Mantener estado o default
            links: links,
            createdAt: task.createdAt || undefined // DB lo maneja si es undefined
        };

        await db.save('tasks', newTask);
        overlay.classList.add('hidden');
        Render.renderBoard();
    };

    // Borrar
    if (taskId) {
        document.getElementById('btn-delete').onclick = async () => {
            if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) { // Confirm traducido
                await db.delete('tasks', taskId);
                overlay.classList.add('hidden');
                Render.renderBoard();
            }
        };
    }
}

// --- MODAL DE ÉPICAS (Gestión Rápida) ---
export async function openEpicModal() {
    overlay.classList.remove('hidden');
    title.textContent = "GESTIÓN DE FASES"; // Cambiado de "EPIC_MANAGER"
    
    const refreshList = async () => {
        const epics = await EpicManager.getAll();
        const listHTML = epics.map(e => `
            <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid #000; padding:10px; margin-bottom:5px; background: #fff;">
                <div>
                    <span style="display:inline-block; width:15px; height:15px; background:${e.color}; border:1px solid #000; margin-right:10px;"></span>
                    <b>${e.title}</b>
                </div>
                <button class="btn-del-epic btn btn-text" data-id="${e.id}">DEL</button>
            </div>
        `).join('');
        
        body.innerHTML = `
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="new-epic-name" placeholder="Nombre de la fase..." style="margin:0;">
                <button id="btn-create-epic" class="btn btn-acid">CREAR</button>
            </div>
            <div id="epics-list">${listHTML}</div>
        `;

        // Eventos
        document.getElementById('btn-create-epic').onclick = async () => {
            const name = document.getElementById('new-epic-name').value;
            if (name) {
                await EpicManager.create(name);
                refreshList();
            }
        };

        document.querySelectorAll('.btn-del-epic').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('¿Eliminar Fase? Las tareas asignadas quedarán sin fase.')) { // Confirm traducido
                    await EpicManager.delete(btn.dataset.id);
                    refreshList();
                }
            };
        });
    };

    refreshList();
}
