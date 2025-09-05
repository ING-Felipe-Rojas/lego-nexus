document.addEventListener('DOMContentLoaded', function() {
// DOM Elements
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('sidebarToggleBtn');
const mainContent = document.querySelector('main');
const createUserBtn = document.getElementById('createUserBtn');
const roleItems = document.querySelectorAll('.role-item[data-role]');
const userModal = document.getElementById('userModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const userForm = document.getElementById('userForm');
const userRoleSelect = document.getElementById('userRole');
const userSubRoleSelect = document.getElementById('userSubRole');
const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const searchInput = document.getElementById('searchInput');
const searchIcon = document.getElementById('searchIcon');
const logoutBtn = document.getElementById('logoutBtn');
const darkModeToggle = document.getElementById('darkModeToggle');

// Elementos para la sección Oracle (SGU_USUARIO)
const loadOracleBtn = document.getElementById('loadOracleBtn');
const oracleLimitInput = document.getElementById('oracleLimit');
const oracleTable = document.getElementById('oracleTable');
const oracleTableHead = oracleTable ? oracleTable.querySelector('thead') : null;
const oracleTableBody = oracleTable ? oracleTable.querySelector('tbody') : null;
const oracleNoData = document.getElementById('oracleNoData');
const oracleStatus = document.getElementById('oracleStatus');

// Sub-roles mapping (kept for reference, but not used for form interaction)
const subRoles = {
alumnos: [
{ value: 'vigente', label: 'Vigente' },
{ value: 'titulado', label: 'Titulado' },
{ value: 'egresado', label: 'Egresado' }
],
funcionarios: [
{ value: 'administrativo', label: 'Administrativo' },
{ value: 'docente', label: 'Docente' },
{ value: 'directivo', label: 'Directivo' }
],
externos: [
{ value: 'proveedor', label: 'Proveedor' },
{ value: 'invitado', label: 'Invitado' },
{ value: 'convenio', label: 'Convenio' }
]
};

// Mapeo de roles a IDs para la base de datos Oracle
const roleIdMap = {
alumnos: 1,
funcionarios: 2,
externos: 3
};


/**
* @function init
* @description Inicializa la aplicación al cargar el DOM.
*              Carga los usuarios de Oracle y aplica el modo oscuro si está guardado.
*/
// Initialize the app
loadAndRenderOracleUsers(); // Cargar todos los usuarios de Oracle al inicio

// Dark Mode Initialization
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    darkModeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
} else {
    document.body.classList.remove('dark-mode');
    darkModeToggle.querySelector('i').classList.replace('fa-sun', 'fa-moon');
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

/**
* @function toggleSidebar
* @description Maneja la funcionalidad de alternar la visibilidad del sidebar.
*              Colapsa/expande el sidebar y rota el icono de alternancia.
*/
toggleSidebarBtn.addEventListener('click', () => {
sidebar.classList.toggle('collapsed');
toggleSidebarBtn.classList.toggle('rotated');

// If the sidebar is collapsed, close any expanded sub-menus
if (sidebar.classList.contains('collapsed')) {
document.querySelectorAll('.sub-role.expanded').forEach(subRoleEl => {
subRoleEl.classList.remove('expanded');
const chevron = subRoleEl.previousElementSibling.querySelector('.chevron');
if (chevron) {
chevron.classList.remove('rotated');
}
});
}
});

/**
* @function handleDarkModeToggle
* @description Maneja el clic en el botón de modo oscuro.
*              Alterna la clase 'dark-mode' en el body y guarda la preferencia.
*/
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    if (isDarkMode) {
        darkModeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        darkModeToggle.querySelector('i').classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
});


/**
* @function handleRoleItemClick
* @description Maneja el clic en los elementos de rol del sidebar.
*              Alterna la visibilidad de los sub-roles y filtra la tabla de Oracle por el rol seleccionado.
*/
roleItems.forEach(item => {
const role = item.dataset.role;
const subRoleEl = document.getElementById(`${role}-sub`);
const chevron = item.querySelector('.chevron');

item.addEventListener('click', () => {
// Only toggle if sidebar is not collapsed
if (!sidebar.classList.contains('collapsed')) {
subRoleEl.classList.toggle('expanded');
chevron.classList.toggle('rotated');
}

// Filtrar la tabla de Oracle por rol
const roleId = roleIdMap[role];
if (roleId) {
const limit = Math.min(Math.max(parseInt(oracleLimitInput?.value || '100', 10) || 100, 1), 1000);
loadAndRenderOracleUsers(limit, '', roleId); // Pasar roleId, query vacío
}

// Opcional: Desactivar el filtro de búsqueda cuando se selecciona un rol
searchInput.value = '';
searchIcon.style.display = 'block';
});
});


/**
* @function handleUserRoleSelectChange
* @description Maneja el cambio en la selección de rol en el modal de usuario.
*              (Actualmente deshabilitado: Solía poblar y habilitar el selector de sub-rol).
*/
userRoleSelect.addEventListener('change', () => {
// const selectedRole = userRoleSelect.value;
// if (selectedRole) {
//     userSubRoleSelect.disabled = false;
//     userSubRoleSelect.innerHTML = '<option value="">Seleccione un sub-rol</option>';
//     subRoles[selectedRole].forEach(subRole => {
//         const option = document.createElement('option');
//         option.value = subRole.value;
//         option.textContent = subRole.label;
//         userSubRoleSelect.appendChild(option);
//     });
// } else {
//     userSubRoleSelect.disabled = true;
//     userSubRoleSelect.innerHTML = '<option value="">Seleccione un sub-rol</option>';
// }
});

/**
* @function openCreateUserModal
* @description Abre el modal para crear un nuevo usuario.
*              Reinicia los campos del formulario y oculta mensajes de error.
*/
createUserBtn.addEventListener('click', () => {
openCreateUserModal();
});


/**
* @function handleLoadOracleBtnClick
* @description Maneja el clic en el botón para cargar usuarios de Oracle.
*              Carga los usuarios de la base de datos Oracle con el límite especificado.
*/
if (loadOracleBtn) {
loadOracleBtn.addEventListener('click', () => {
const limit = Math.min(Math.max(parseInt(oracleLimitInput?.value || '100', 10) || 100, 1), 1000);
loadAndRenderOracleUsers(limit);
});
}

/**
* @function closeModal
* @description Cierra el modal de creación/edición de usuario.
*/
closeModal.addEventListener('click', () => {
userModal.style.display = 'none';
});

/**
* @function cancelBtnClick
* @description Cierra el modal de creación/edición de usuario al hacer clic en el botón Cancelar.
*/
cancelBtn.addEventListener('click', () => {
userModal.style.display = 'none';
});

/**
* @function closeModalOutsideClick
* @description Cierra el modal de creación/edición de usuario si se hace clic fuera de su contenido.
*/
userModal.addEventListener('click', (e) => {
if (e.target === userModal) {
userModal.style.display = 'none';
}
});

/**
* @function handleUserFormSubmit
* @description Maneja el envío del formulario de usuario.
*              Valida los datos, envía la información a la API de creación o actualización y maneja la respuesta.
*/
userForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const userId = document.getElementById('userId').value;
    const isEditing = userId !== '';

    // The 'department' and 'subRole' fields are not part of the DB schema provided.
    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value,
        role: document.getElementById('userRole').value, // This is the role NAME ('alumnos', etc)
    };
    
    let apiUrl = 'api/crear_usuario.php';
    if (isEditing) {
        // IMPORTANT: Assumes the API for update needs the user ID.
        // The user object from the database must have a unique identifier, here assumed to be 'USR_ID'.
        userData.id = userId; 
        apiUrl = 'api/actualizar_usuario.php';
    }

    const saveBtn = document.getElementById('saveBtn');
    const saveSpinner = document.getElementById('saveSpinner');
    const saveText = document.getElementById('saveText');

    // Show loading state
    saveBtn.disabled = true;
    saveSpinner.classList.remove('hidden');
    saveText.textContent = isEditing ? 'Actualizando...' : 'Guardando...';

    // API call to the backend
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(data.message || `Usuario ${isEditing ? 'actualizado' : 'guardado'} correctamente`, 'success');
            userModal.style.display = 'none';
            loadAndRenderOracleUsers(); // Refresh the table
        } else {
            showToast(data.error || 'Ocurrió un error en el servidor', 'error');
        }
    })
    .catch(error => {
        console.error('Error en la llamada fetch:', error);
        showToast('Error de conexión. No se pudo contactar al servidor.', 'error');
    })
    .finally(() => {
        // Reset loading state
        saveBtn.disabled = false;
        saveSpinner.classList.add('hidden');
        saveText.textContent = 'Guardar';
    });
});


/**
* @function cancelDeleteBtnClick
* @description Cierra el modal de confirmación de eliminación.
*/
cancelDeleteBtn.addEventListener('click', () => {
deleteModal.style.display = 'none';
});

/**
* @function confirmDeleteBtnClick
* @description Maneja la confirmación de eliminación de un usuario.
*              Llama a la API para eliminar el usuario y actualiza la tabla.
*/
confirmDeleteBtn.addEventListener('click', () => {
    const userId = confirmDeleteBtn.dataset.userId;
    if (!userId) {
        showToast('No se encontró el ID del usuario a eliminar.', 'error');
        deleteModal.style.display = 'none';
        return;
    }

    const deleteSpinner = document.getElementById('deleteSpinner');
    const deleteText = document.getElementById('deleteText');

    // Show loading state
    confirmDeleteBtn.disabled = true;
    deleteSpinner.classList.remove('hidden');
    deleteText.textContent = 'Eliminando...';

    // API call to the backend to delete the user
    // IMPORTANT: This requires 'api/eliminar_usuario.php' to exist and handle the request.
    fetch(`api/eliminar_usuario.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ id: userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(data.message || 'Usuario eliminado correctamente', 'success');
            deleteModal.style.display = 'none';
            loadAndRenderOracleUsers(); // Refresh the table
        } else {
            showToast(data.error || 'Ocurrió un error al eliminar el usuario', 'error');
        }
    })
    .catch(error => {
        console.error('Error en la llamada fetch para eliminar:', error);
        showToast('Error de conexión. No se pudo contactar al servidor.', 'error');
    })
    .finally(() => {
        // Reset loading state
        confirmDeleteBtn.disabled = false;
        deleteSpinner.classList.add('hidden');
        deleteText.textContent = 'Eliminar';
        delete confirmDeleteBtn.dataset.userId; // Clean up
    });
});


/**
* @function handleSearchInput
* @description Maneja la entrada de texto en el campo de búsqueda.
*              Realiza una búsqueda en tiempo real en la tabla de usuarios de Oracle.
*/
searchInput.addEventListener('input', () => {
const searchTerm = searchInput.value.trim();
const limit = Math.min(Math.max(parseInt(oracleLimitInput?.value || '100', 10) || 100, 1), 1000);
loadAndRenderOracleUsers(limit, searchTerm); // Pasa el término de búsqueda
});

/**
* @function handleSearchInputFocus
* @description Oculta el icono de búsqueda cuando el campo de búsqueda está en foco.
*/
searchInput.addEventListener('focus', () => {
searchIcon.style.display = 'none';
});

/**
* @function handleSearchInputBlur
* @description Muestra el icono de búsqueda si el campo de búsqueda está vacío al perder el foco.
*/
searchInput.addEventListener('blur', () => {
if (searchInput.value === '') {
searchIcon.style.display = 'block';
}
});

// Hide search icon if there's already text on load
if (searchInput.value !== '') {
searchIcon.style.display = 'none';
}

/**
* @function openCreateUserModal
* @description Abre el modal para crear un nuevo usuario.
*              Reinicia los campos del formulario y oculta mensajes de error.
*/
function openCreateUserModal() {
document.getElementById('modalTitle').textContent = 'Crear Usuario';
document.getElementById('userId').value = '';
document.getElementById('userName').value = '';
document.getElementById('userEmail').value = '';
document.getElementById('userPhone').value = '';
document.getElementById('userDepartment').value = '';
document.getElementById('userRole').value = '';
document.getElementById('userSubRole').innerHTML = '<option value="">Seleccione un sub-rol</option>';
document.getElementById('userSubRole').disabled = true; // Ensure it's disabled

// Clear any error messages
document.querySelectorAll('.error-message').forEach(el => {
el.classList.add('hidden');
});

userModal.style.display = 'flex';
}

/**
* @function openEditUserModal
* @description Abre el modal para editar un usuario existente y lo puebla con sus datos.
* @param {Object} user - El objeto de usuario con los datos de la fila.
*/
function openEditUserModal(user) {
    // IMPORTANT: Assumes the user object from the API contains a unique identifier, e.g., 'USR_ID'.
    if (!user || typeof user.USR_ID === 'undefined') {
        showToast('No se pudo obtener el ID del usuario para editar.', 'error');
        return;
    }

    document.getElementById('modalTitle').textContent = 'Editar Usuario';
    document.getElementById('userId').value = user.USR_ID; // Hidden field for the user ID
    document.getElementById('userName').value = user.USR_NOMBRE || '';
    document.getElementById('userEmail').value = user.USR_CORREO || '';
    document.getElementById('userPhone').value = user.USR_TELEFONO || '';
    
    // Find role name from role ID
    const roleNameMap = Object.fromEntries(Object.entries(roleIdMap).map(([name, id]) => [id, name]));
    const roleName = roleNameMap[user.USR_ROL_ID] || '';
    document.getElementById('userRole').value = roleName;

    // Department is not in the provided columns, so we leave it empty.
    document.getElementById('userDepartment').value = ''; 

    // Clear any previous error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
    });

    userModal.style.display = 'flex';
}

/**
* @function openDeleteUserModal
* @description Abre el modal de confirmación para eliminar un usuario.
* @param {Object} user - El objeto de usuario con los datos de la fila.
*/
function openDeleteUserModal(user) {
    if (!user || typeof user.USR_ID === 'undefined') {
        showToast('No se pudo obtener el ID del usuario para eliminar.', 'error');
        return;
    }
    
    const deleteUserNameSpan = document.getElementById('deleteUserName');
    if (deleteUserNameSpan) {
        deleteUserNameSpan.textContent = user.USR_NOMBRE || 'este usuario';
    }

    // Store the user ID on the confirm button to use it when the user confirms
    confirmDeleteBtn.dataset.userId = user.USR_ID;

    deleteModal.style.display = 'flex';
}

// ---- Ayudantes de Oracle (SGU_USUARIO) ----
/**
* @function loadAndRenderOracleUsers
* @description Carga y renderiza los datos de SGU_USUARIO desde la API PHP de Oracle.
* @param {number} limit - Cantidad máxima de filas a traer. Por defecto 100.
* @param {string} query - Término de búsqueda para filtrar por nombre o correo. Por defecto vacío.
* @param {number|null} roleId - ID del rol para filtrar usuarios. Por defecto null (sin filtro de rol).
*/
async function loadAndRenderOracleUsers(limit = 100, query = '', roleId = null) {
if (!oracleTableHead || !oracleTableBody) return;

let url = `api/usuarios.php?limit=${encodeURIComponent(limit)}`;
let statusMessage = `Cargando datos (límite ${limit})...`;

if (query) {
url += `&op=search&query=${encodeURIComponent(query)}`;
statusMessage = `Buscando '${query}' (límite ${limit})...`;
} else if (roleId !== null) { // Añadir filtro de rol si está presente y no hay búsqueda
url += `&role_id=${encodeURIComponent(roleId)}`;
const roleName = Object.keys(roleIdMap).find(key => roleIdMap[key] === roleId);
statusMessage = `Cargando ${roleName || 'usuarios'} (límite ${limit})...`;
}

setOracleStatus(statusMessage);
toggleOracleNoData(false);
clearOracleTable();

try {
const resp = await fetch(url, {
headers: { 'Accept': 'application/json' }
});
const data = await resp.json();

if (!resp.ok || !data.success) {
const msg = data && data.error ? data.error : `Error HTTP ${resp.status}`;
throw new Error(msg);
}

// IMPORTANT: The API at 'api/usuarios.php' must return 'USR_ID' for edit/delete to work.
renderOracleTable(data.rows || []);
setOracleStatus(`Cargadas ${data.count || 0} filas`);
if (!data.rows || data.rows.length === 0) toggleOracleNoData(true);
} catch (err) {
console.error(err);
setOracleStatus('');
showToast(`Error cargando SGU_USUARIO: ${err.message}`, 'error');
toggleOracleNoData(true);
}
}

/**
* @function renderOracleTable
* @description Renderiza los datos obtenidos de la API de Oracle en la tabla SGU_USUARIO.
* @param {Array<Object>} rows - Filas de datos a renderizar.
*/
function renderOracleTable(rows) {
    clearOracleTable();

    const headers = ["Nombre", "Correo", "Teléfono", "Rol", "Fecha de registro", "Acciones"];
    
    // Create reverse map for roles to get name from ID
    const roleNameMap = Object.fromEntries(Object.entries(roleIdMap).map(([name, id]) => [id, name]));

    // Encabezados
    const trHead = document.createElement('tr');
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        trHead.appendChild(th);
    });
    oracleTableHead.appendChild(trHead);

    // Cuerpo
    rows.forEach(row => {
        const tr = document.createElement('tr');

        // IMPORTANT: The keys here ('USR_NOMBRE', 'USR_CORREO', etc.) 
        // must match what the 'api/usuarios.php' script returns.
        const cells = [
            row.USR_NOMBRE,
            row.USR_CORREO,
            row.USR_TELEFONO,
            roleNameMap[row.USR_ROL_ID] ? capitalizeFirstLetter(roleNameMap[row.USR_ROL_ID]) : 'Desconocido',
            row.USR_FECHA_REG
        ];

        cells.forEach(cellContent => {
            const td = document.createElement('td');
            td.textContent = cellContent === null || typeof cellContent === 'undefined' ? '' : String(cellContent);
            tr.appendChild(td);
        });

        // Actions cell
        const tdActions = document.createElement('td');
        tdActions.classList.add('action-buttons'); // For styling

        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.className = 'btn-edit';
        editBtn.title = 'Editar';
        editBtn.addEventListener('click', () => openEditUserModal(row));

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.className = 'btn-delete';
        deleteBtn.title = 'Eliminar';
        deleteBtn.addEventListener('click', () => openDeleteUserModal(row));
        
        tdActions.appendChild(editBtn);
        tdActions.appendChild(deleteBtn);
        tr.appendChild(tdActions);

        oracleTableBody.appendChild(tr);
    });
}


/**
* @function clearOracleTable
* @description Limpia el contenido de la tabla SGU_USUARIO (encabezado y cuerpo).
*/
function clearOracleTable() {
if (oracleTableHead) oracleTableHead.innerHTML = '';
if (oracleTableBody) oracleTableBody.innerHTML = '';
}

/**
* @function toggleOracleNoData
* @description Muestra u oculta el mensaje de "No hay datos para mostrar" en la sección de Oracle.
* @param {boolean} show - Si es true, muestra el mensaje; si es false, lo oculta.
*/
function toggleOracleNoData(show) {
if (!oracleNoData) return;
if (show) oracleNoData.classList.remove('hidden');
else oracleNoData.classList.add('hidden');
}

/**
* @function setOracleStatus
* @description Actualiza el texto de estado en la sección de Oracle.
* @param {string} text - El mensaje de estado a mostrar.
*/
function setOracleStatus(text) {
if (oracleStatus) oracleStatus.textContent = text || '';
}


/**
* @function validateForm
* @description Valida los campos del formulario de creación/edición de usuario.
* @returns {boolean} - True si el formulario es válido, false en caso contrario.
*/
function validateForm() {
let isValid = true;

// Name validation
const nameInput = document.getElementById('userName');
const nameError = document.getElementById('userNameError');
if (!nameInput.value.trim()) {
nameError.classList.remove('hidden');
isValid = false;
}
else {
nameError.classList.add('hidden');
}

// Email validation
const emailInput = document.getElementById('userEmail');
const emailError = document.getElementById('userEmailError');
const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
if (!emailRegex.test(emailInput.value)) {
emailError.classList.remove('hidden');
isValid = false;
}
else {
emailError.classList.add('hidden');
}

// Phone validation
const phoneInput = document.getElementById('userPhone');
const phoneError = document.getElementById('userPhoneError');
const phoneRegex = /^[\d\+\-\(\)\s]{7,15}$/;
if (!phoneRegex.test(phoneInput.value)) {
phoneError.classList.remove('hidden');
isValid = false;
}
else {
phoneError.classList.add('hidden');
}

// Department validation (optional, as it's not in the main table)
const deptInput = document.getElementById('userDepartment');
const deptError = document.getElementById('userDepartmentError');
if (!deptInput.value.trim()) {
deptError.classList.remove('hidden');
isValid = false;
}
else {
deptError.classList.add('hidden');
}

// Role validation
const roleInput = document.getElementById('userRole');
const roleError = document.getElementById('userRoleError');
if (!roleInput.value) {
roleError.classList.remove('hidden');
isValid = false;
}
else {
roleError.classList.add('hidden');
}

return isValid;
}


/**
* @function showToast
* @description Muestra una notificación Toastify en la esquina superior derecha de la pantalla.
* @param {string} message - El mensaje a mostrar.
* @param {string} type - El tipo de mensaje ('success' o 'error') para determinar el color de fondo.
*/
function showToast(message, type = 'success') {
const backgroundColor = type === 'success' ? '#046cae' : '#f56565';

Toastify({
text: message,
duration: 3000,
close: true,
gravity: "top",
position: "right",
backgroundColor,
stopOnFocus: true
}).showToast();
}

/**
* @function capitalizeFirstLetter
* @description Convierte la primera letra de una cadena a mayúscula.
* @param {string} string - La cadena de entrada.
* @returns {string} La cadena con la primera letra en mayúscula.
*/
function capitalizeFirstLetter(string) {
if (!string) return '';
return string.charAt(0).toUpperCase() + string.slice(1);
}
});
