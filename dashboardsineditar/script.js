document.addEventListener('DOMContentLoaded', function() {
// DOM Elements
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('sidebarToggleBtn');
const mainContent = document.querySelector('main');
const createUserBtn = document.getElementById('createUserBtn');
const addFirstUserBtn = document.getElementById('addFirstUserBtn');
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
const usersTable = document.getElementById('usersTable');
const noUsersMessage = document.getElementById('noUsersMessage');

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

// Initialize users from localStorage or create empty array
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentFilter = { role: null, subRole: null };

/**
* @function init
* @description Inicializa la aplicación al cargar el DOM.
*              Renderiza la tabla de usuarios (localStorage) y carga los usuarios de Oracle.
*/
// Initialize the app
renderTable(); // Esto es para la tabla de usuarios de localStorage
updateUIState(); // Esto es para la tabla de usuarios de localStorage
loadAndRenderOracleUsers(); // Cargar todos los usuarios de Oracle al inicio

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
* @function handleSubRoleItemClick
* @description Maneja el clic en los elementos de sub-rol del sidebar.
*              Aplica el filtro de sub-rol a la tabla de usuarios (localStorage) y resalta el filtro seleccionado.
*/
document.querySelectorAll('.sub-role .role-item').forEach(item => {
item.addEventListener('click', () => {
const role = item.closest('.role-container').querySelector('.role-item[data-role]').dataset.role;
const subRole = item.dataset.subrole;

currentFilter = { role, subRole };
renderTable();

// Highlight selected filter
document.querySelectorAll('.sub-role .role-item').forEach(el => {
el.classList.remove('bg-white', 'bg-opacity-20');
});
item.classList.add('bg-white', 'bg-opacity-20');
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

addFirstUserBtn.addEventListener('click', () => {
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
*              Valida los datos, envía la información a la API de creación de usuario y maneja la respuesta.
*/
userForm.addEventListener('submit', function(e) {
e.preventDefault();

if (!validateForm()) {
return;
}

const userId = document.getElementById('userId').value;
const isEditing = userId !== '';

// NOTE: The backend script currently only supports CREATING users.
// The 'department' and 'subRole' fields are not saved to the database.
const userData = {
name: document.getElementById('userName').value,
email: document.getElementById('userEmail').value,
phone: document.getElementById('userPhone').value,
role: document.getElementById('userRole').value,
// id: userId // Include if you implement update functionality
};

const saveBtn = document.getElementById('saveBtn');
const saveSpinner = document.getElementById('saveSpinner');
const saveText = document.getElementById('saveText');

// Show loading state
saveBtn.disabled = true;
saveSpinner.classList.remove('hidden');
saveText.textContent = isEditing ? 'Actualizando...' : 'Creando...';

// API call to the backend
fetch('api/crear_usuario.php', {
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
showToast(data.message || 'Usuario guardado correctamente', 'success');
userModal.style.display = 'none';
// Refresh the Oracle table to show the new user
if (typeof loadAndRenderOracleUsers === 'function') {
loadAndRenderOracleUsers();
}
} else {
// Show error message from the server
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
*              Simula la eliminación del usuario del almacenamiento local y actualiza la UI.
*/
confirmDeleteBtn.addEventListener('click', () => {
const userId = deleteModal.dataset.userId;

// Show loading state
document.getElementById('confirmDeleteBtn').disabled = true;
document.getElementById('deleteSpinner').classList.remove('hidden');
document.getElementById('deleteText').textContent = 'Eliminando...';

// Simulate API call
setTimeout(() => {
users = users.filter(user => user.id !== userId);
localStorage.setItem('users', JSON.stringify(users));

renderTable();
updateUIState();
deleteModal.style.display = 'none';

// Reset loading state
document.getElementById('confirmDeleteBtn').disabled = false;
document.getElementById('deleteSpinner').classList.add('hidden');
document.getElementById('deleteText').textContent = 'Eliminar';

// Show success toast
showToast('Usuario eliminado correctamente', 'success');
}, 800);
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

renderOracleTable(data.columns || [], data.rows || []);
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
* @param {Array<string>} columns - Nombres de las columnas a mostrar.
* @param {Array<Object>} rows - Filas de datos a renderizar.
*/
function renderOracleTable(columns, rows) {
clearOracleTable();

// Encabezados
const trHead = document.createElement('tr');
if (columns.length === 0 && rows.length > 0) {
columns = Object.keys(rows[0]);
}
columns.forEach(col => {
const th = document.createElement('th');
th.textContent = col;
trHead.appendChild(th);
});
oracleTableHead.appendChild(trHead);

// Cuerpo
rows.forEach(row => {
const tr = document.createElement('tr');
columns.forEach(col => {
const td = document.createElement('td');
const val = row[col];
td.textContent = val === null || typeof val === 'undefined' ? '' : String(val);
tr.appendChild(td);
});
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
* @function openEditUserModal
* @description Abre el modal para editar un usuario existente (funcionalidad de localStorage).
* @param {string} userId - El ID del usuario a editar.
*/
function openEditUserModal(userId) {
const user = users.find(u => u.id === userId);
if (!user) return;

document.getElementById('modalTitle').textContent = 'Editar Usuario';
document.getElementById('userId').value = user.id;
document.getElementById('userName').value = user.name;
document.getElementById('userEmail').value = user.email;
document.getElementById('userPhone').value = user.phone;
document.getElementById('userDepartment').value = user.department;
document.getElementById('userRole').value = user.role;

// Sub-roles dropdown remains disabled
userSubRoleSelect.disabled = true;
userSubRoleSelect.innerHTML = '<option value="">Seleccione un sub-rol</option>';
// No population logic needed here as it's disabled

// document.getElementById('userSubRole').value = user.subRole; // This line is now irrelevant

// Clear any error messages
document.querySelectorAll('.error-message').forEach(el => {
el.classList.add('hidden');
});

userModal.style.display = 'flex';
}

/**
* @function openDeleteModal
* @description Abre el modal de confirmación para eliminar un usuario (funcionalidad de localStorage).
* @param {string} userId - El ID del usuario a eliminar.
*/
function openDeleteModal(userId) {
const user = users.find(u => u.id === userId);
if (!user) return;

document.getElementById('deleteUserName').textContent = user.name;
deleteModal.dataset.userId = userId;
deleteModal.style.display = 'flex';
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
const emailRegex = /^[\S+@\S+\.\S+]+$/;
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

// Department validation
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

// Sub-Role validation (disabled temporarily)
// const subRoleInput = document.getElementById('userSubRole');
// const subRoleError = document.getElementById('userSubRoleError');
// if (!subRoleInput.value) {
//     subRoleError.classList.remove('hidden');
//     isValid = false;
// }
// else {
//     subRoleError.classList.add('hidden');
// }

return isValid;
}

/**
* @function renderTable
* @description Renderiza la tabla de usuarios (funcionalidad de localStorage).
*              Aplica filtros de rol/sub-rol y búsqueda a los datos locales.
*/
function renderTable() {
const tableBody = document.querySelector('#usersTable tbody');
tableBody.innerHTML = '';

let filteredUsers = [...users];

// Apply role/subrole filter
if (currentFilter.role) {
filteredUsers = filteredUsers.filter(user => user.role === currentFilter.role);

if (currentFilter.subRole) {
filteredUsers = filteredUsers.filter(user => user.subRole === currentFilter.subRole);
}
}

// Apply search filter (This part is now handled by loadAndRenderOracleUsers for Oracle table)
// const searchTerm = searchInput.value.toLowerCase();
// if (searchTerm) {
//     filteredUsers = filteredUsers.filter(user =>
//         user.name.toLowerCase().includes(searchTerm) ||
//         user.email.toLowerCase().includes(searchTerm) ||
//         user.department.toLowerCase().includes(searchTerm)
//     );
// }

// Render filtered users
filteredUsers.forEach(user => {
const tr = document.createElement('tr');

// Get display names for role and subRole
const roleDisplay = capitalizeFirstLetter(user.role);

let subRoleDisplay = '';
// Sub-role display logic removed/disabled
// if (subRoles[user.role]) {
//     const subRoleObj = subRoles[user.role].find(sr => sr.value === user.subRole);
//     subRoleDisplay = subRoleObj ? subRoleObj.label : user.subRole;
// }

tr.innerHTML = `\n            <td>${user.name}</td>\n            <td>${user.email}</td>\n            <td>${user.phone}</td>\n            <td>${user.department}</td>\n            <td>${roleDisplay}</td>\n            <td>${subRoleDisplay}</td>\n            <td>\n              <button class="text-blue-600 hover:text-blue-800 mr-3 edit-btn" data-id="${user.id}">\n                <i class="fas fa-edit"></i>\n              </button>\n              <button class="text-red-600 hover:text-red-800 delete-btn" data-id="${user.id}">\n                <i class="fas fa-trash-alt"></i>\n              </button>\n            </td>\n          `;

tableBody.appendChild(tr);
});

// Add event listeners to edit and delete buttons
document.querySelectorAll('.edit-btn').forEach(btn => {
btn.addEventListener('click', () => openEditUserModal(btn.dataset.id));
});

document.querySelectorAll('.delete-btn').forEach(btn => {
btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
});
}

/**
* @function updateUIState
* @description Actualiza el estado de la interfaz de usuario basado en si hay usuarios en la tabla (localStorage).
*              Muestra/oculta la tabla o el mensaje de "No hay usuarios".
*/
function updateUIState() {
if (users.length === 0) {
usersTable.classList.add('hidden');
noUsersMessage.classList.remove('hidden');
}
else {
usersTable.classList.remove('hidden');
noUsersMessage.classList.add('hidden');
}
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
return string.charAt(0).toUpperCase() + string.slice(1);
}
});
