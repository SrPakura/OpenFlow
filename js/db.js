/* 
    Gestor de Base de Datos IndexedDB 
    Encapsulado en promesas para usar async/await fácilmente.
*/

const DB_NAME = 'JiraLiteDB';
const DB_VERSION = 1;

export const db = {
    database: null,

    // 1. Abrir la conexión
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            // Se ejecuta solo la primera vez o si cambiamos la versión
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                // Store de TAREAS
                if (!db.objectStoreNames.contains('tasks')) {
                    const store = db.createObjectStore('tasks', { keyPath: 'id' });
                    store.createIndex('status', 'status', { unique: false });
                }

                // Store de LOGS (Auditoría para el TFM)
                if (!db.objectStoreNames.contains('logs')) {
                    const store = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('date', 'date', { unique: false });
                }
            };

            request.onsuccess = (e) => {
                this.database = e.target.result;
                console.log("✅ DB Conectada");
                resolve(this.database);
            };

            request.onerror = (e) => {
                console.error("❌ Error DB:", e.target.error);
                reject(e.target.error);
            };
        });
    },

    // 2. Método Genérico para guardar tareas (Crear o Actualizar)
    async saveTask(task) {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
            
            // Si no tiene fecha de creación, la ponemos
            if (!task.createdAt) task.createdAt = new Date().toISOString();
            task.updatedAt = new Date().toISOString();

            const request = store.put(task); // .put sirve para insert y update

            request.onsuccess = () => {
                // Registrar en Auditoría automáticamente
                this.logAction('SAVE_TASK', `Tarea guardada: ${task.title}`);
                resolve(request.result);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    // 3. Obtener todas las tareas
    async getAllTasks() {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(['tasks'], 'readonly');
            const store = transaction.objectStore('tasks');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    // 4. Borrar tarea
    async deleteTask(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
            const request = store.delete(id);

            request.onsuccess = () => {
                this.logAction('DELETE_TASK', `Tarea eliminada ID: ${id}`);
                resolve();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    // 5. Sistema de Logs (Caja Negra)
    async logAction(actionType, details) {
        const transaction = this.database.transaction(['logs'], 'readwrite');
        const store = transaction.objectStore('logs');
        store.add({
            action: actionType,
            details: details,
            date: new Date().toISOString(),
            user: 'Usuario Local' // Aquí podrías poner el nombre si lo pidieras al inicio
        });
    },

    // 6. Exportar todo (Backup)
    async exportData() {
        const tasks = await this.getAllTasks();
        
        // Obtener logs también
        const logs = await new Promise((resolve) => {
            const tx = this.database.transaction(['logs'], 'readonly');
            tx.objectStore('logs').getAll().onsuccess = (e) => resolve(e.target.result);
        });

        return {
            exportDate: new Date().toISOString(),
            tasks: tasks,
            auditLogs: logs
        };
    }
};
