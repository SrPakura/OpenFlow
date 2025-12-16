# OPENFLOW v2

**Industrial Grade Project Management System (Local-First)**

OpenFlow es una Single Page Application (SPA) de gestión de proyectos diseñada bajo la filosofía "Local-First". Elimina la latencia y la complejidad de herramientas corporativas como Jira, ofreciendo una interfaz brutalista, instantánea y centrada en la eficiencia del ingeniero.

Este software está diseñado para ejecutarse íntegramente en el cliente (navegador), garantizando la privacidad absoluta de los datos y la operatividad sin conexión a internet.

---

## Manifiesto y Filosofía

La gestión de proyectos moderna se ha saturado de "bloatware": notificaciones innecesarias, dependencia de la nube y tiempos de carga excesivos. OpenFlow propone un retorno a la funcionalidad pura:

1.  **Soberanía de Datos:** Los datos residen en la base de datos indexada del usuario (IndexedDB). No hay servidores intermedios, ni tracking, ni minería de datos.
2.  **Brutalismo Funcional:** La interfaz sigue una estética industrial de alto contraste. Se prioriza la legibilidad y la velocidad de interacción sobre la decoración superflua.
3.  **Cero Latencia:** Al eliminar el backend remoto, las operaciones de creación, actualización y renderizado ocurren en milisegundos.
4.  **Portabilidad:** El sistema permite volcar el estado completo de la memoria a un archivo JSON estándar (Dump), garantizando la interoperabilidad y el respaldo físico.

---

## Arquitectura Técnica

El proyecto está construido con Vanilla JavaScript (ES6 Modules), sin frameworks reactivos pesados, para mantener el bundle size al mínimo absoluto.

### Stack Tecnológico
*   **Core:** HTML5, CSS3 (CSS Grid/Flexbox), JavaScript (ES Modules).
*   **Persistencia:** IndexedDB (Wrapper asíncrono propio con control de versiones y migraciones de esquema).
*   **Visualización:** Integración de `frappe-gantt` mediante Adapter Pattern para sincronización bidireccional.
*   **Estilo:** Sistema de diseño propio basado en variables CSS (Custom Properties) y estética terminal.

### Estructura de Módulos
El código sigue una arquitectura modular desacoplada:

*   `core/db.js`: Capa de abstracción sobre IndexedDB. Maneja transacciones y actualizaciones de esquema (v1 -> v2).
*   `modules/board.js`: Lógica de negocio del tablero Kanban y gestión de estados.
*   `modules/gantt.js`: Adaptador que traduce los modelos de datos locales a la visualización cronológica SVG.
*   `modules/epics.js`: Gestión de entidades jerárquicas (Fases del proyecto).
*   `modules/io.js`: Sistema de Input/Output para la serialización y restauración de la base de datos.
*   `ui/`: Controladores de renderizado del DOM y gestión de eventos de interfaz.

---

## Manual de Operaciones (Tutorial)

### 1. Inicialización y Fases
Al iniciar el sistema por primera vez, la base de datos se crea automáticamente.
*   Navegue a **GESTIONAR FASES** en la barra superior.
*   Defina las grandes etapas de su proyecto (Ej: "Análisis", "Desarrollo", "Testing").
*   El sistema asignará un color identificativo a cada fase para su trazabilidad visual.

### 2. Creación de Protocolos (Tareas)
*   Utilice el botón **+ NUEVA TAREA**.
*   Asigne título, fechas de inicio/fin y vincule la tarea a una Fase (Épica).
*   **Recursos Externos:** OpenFlow no almacena binarios. Utilice el sistema de slots para añadir enlaces a repositorios, documentos de Drive o diseños en Figma.

### 3. Gestión de Flujo (Kanban)
El tablero se divide en cuatro estados rígidos:
*   **POR HACER:** Backlog de tareas pendientes.
*   **EN CURSO:** Tareas activas.
*   **EN REVISIÓN:** Cuello de botella intencional para control de calidad.
*   **HECHO:** Tareas finalizadas.

Arrastre y suelte las tarjetas para cambiar su estado. El sistema actualiza la base de datos en tiempo real.

### 4. Control Cronológico (Gantt)
Cambie a la vista **[ CRONOGRAMA ]**.
*   Visualice la duración real de las tareas y su solapamiento.
*   **Interactividad:** Puede arrastrar las barras de tiempo directamente en el gráfico para replanificar. Los cambios se reflejarán automáticamente en las fechas de la tarea y en el tablero Kanban.

### 5. Respaldo y Migración
Dado que los datos son locales, es responsabilidad del usuario realizar copias de seguridad.
*   Utilice **EXPORTAR** para descargar un archivo `.json` con el estado completo del proyecto.
*   Utilice **IMPORTAR** para restaurar un proyecto en otro dispositivo o navegador.
    *   *Nota:* La importación sobrescribe la base de datos actual.

---

## Despliegue e Instalación

### Requisitos
Cualquier navegador moderno con soporte para ES6 Modules e IndexedDB (Chrome, Firefox, Edge, Safari).

### Ejecución Local
Debido a las políticas de seguridad CORS de los módulos ES6, el proyecto debe servirse a través de un servidor HTTP local, no abriendo el archivo directamente.

1.  Clonar el repositorio.
2.  Servir el directorio raíz.
    *   Con Python: `python3 -m http.server`
    *   Con Node/VSCode: Extension "Live Server".
3.  Acceder a `localhost:port`.

### Despliegue en Producción
El proyecto es estático. Puede desplegarse directamente en GitHub Pages, Vercel o Netlify sin configuración de build.
