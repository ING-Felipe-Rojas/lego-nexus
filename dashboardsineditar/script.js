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

    // Sub-roles mapping
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

    // Initialize users from localStorage or create empty array
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let currentFilter = { role: null, subRole: null };

    // Initialize the app
    renderTable();
    updateUIState();

    // Sidebar Toggle Functionality
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

    // Toggle sidebar role items
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
        });
    });

    // Event Listeners for sub-roles
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

    // Handle role selection in modal
    userRoleSelect.addEventListener('change', () => {
        const selectedRole = userRoleSelect.value;

        if (selectedRole) {
            userSubRoleSelect.disabled = false;
            userSubRoleSelect.innerHTML = '<option value="">Seleccione un sub-rol</option>';

            subRoles[selectedRole].forEach(subRole => {
                const option = document.createElement('option');
                option.value = subRole.value;
                option.textContent = subRole.label;
                userSubRoleSelect.appendChild(option);
            });
        } else {
            userSubRoleSelect.disabled = true;
            userSubRoleSelect.innerHTML = '<option value="">Seleccione un sub-rol</option>';
        }
    });

    // Create User Button
    createUserBtn.addEventListener('click', () => {
        openCreateUserModal();
    });

    addFirstUserBtn.addEventListener('click', () => {
        openCreateUserModal();
    });

    // Cargar SGU_USUARIO (Oracle) al hacer clic
    if (loadOracleBtn) {
        loadOracleBtn.addEventListener('click', () => {
            const limit = Math.min(Math.max(parseInt(oracleLimitInput?.value || '100', 10) || 100, 1), 1000);
            loadAndRenderOracleUsers(limit);
        });
    }

    // Close Modal
    closeModal.addEventListener('click', () => {
        userModal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        userModal.style.display = 'none';
    });

    // Close when clicking outside the modal
    userModal.addEventListener('click', (e) => {
        if (e.target === userModal) {
            userModal.style.display = 'none';
        }
    });

    // User Form Submit
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

    // Delete User Confirmation
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });

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

    // Search functionality for Oracle table
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim();
        const limit = Math.min(Math.max(parseInt(oracleLimitInput?.value || '100', 10) || 100, 1), 1000);
        loadAndRenderOracleUsers(limit, searchTerm);
    });

    // Search Icon Visibility
    searchInput.addEventListener('focus', () => {
        searchIcon.style.display = 'none';
    });

    searchInput.addEventListener('blur', () => {
        if (searchInput.value === '') {
            searchIcon.style.display = 'block';
        }
    });

    // Hide search icon if there's already text on load
    if (searchInput.value !== '') {
        searchIcon.style.display = 'none';
    }

    // Functions
    function openCreateUserModal() {
        document.getElementById('modalTitle').textContent = 'Crear Usuario';
        document.getElementById('userId').value = '';
        document.getElementById('userName').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userPhone').value = '';
        document.getElementById('userDepartment').value = '';
        document.getElementById('userRole').value = '';
        document.getElementById('userSubRole').innerHTML = '<option value="">Seleccione un sub-rol</option>';
        document.getElementById('userSubRole').disabled = true;

        // Clear any error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.add('hidden');
        });

        userModal.style.display = 'flex';
    }

    // ---- Ayudantes de Oracle (SGU_USUARIO) ----
    async function loadAndRenderOracleUsers(limit = 100, query = '') {
        if (!oracleTableHead || !oracleTableBody) return;

        let url = `api/usuarios.php?limit=${encodeURIComponent(limit)}`;
        let statusMessage = `Cargando datos (límite ${limit})...`;

        if (query) {
            url += `&op=search&query=${encodeURIComponent(query)}`;
            statusMessage = `Buscando '${query}' (límite ${limit})...`;
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

    function clearOracleTable() {
        if (oracleTableHead) oracleTableHead.innerHTML = '';
        if (oracleTableBody) oracleTableBody.innerHTML = '';
    }

    function toggleOracleNoData(show) {
        if (!oracleNoData) return;
        if (show) oracleNoData.classList.remove('hidden');
        else oracleNoData.classList.add('hidden');
    }

    function setOracleStatus(text) {
        if (oracleStatus) oracleStatus.textContent = text || '';
    }

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

        // Populate sub-roles dropdown
        userSubRoleSelect.disabled = false;
        userSubRoleSelect.innerHTML = '<option value="">Seleccione un sub-rol</option>';

        subRoles[user.role].forEach(subRole => {
            const option = document.createElement('option');
            option.value = subRole.value;
            option.textContent = subRole.label;
            userSubRoleSelect.appendChild(option);
        });

        document.getElementById('userSubRole').value = user.subRole;

        // Clear any error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.add('hidden');
        });

        userModal.style.display = 'flex';
    }

    function openDeleteModal(userId) {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('deleteUserName').textContent = user.name;
        deleteModal.dataset.userId = userId;
        deleteModal.style.display = 'flex';
    }

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

        // Sub-Role validation
        const subRoleInput = document.getElementById('userSubRole');
        const subRoleError = document.getElementById('userSubRoleError');
        if (!subRoleInput.value) {
            subRoleError.classList.remove('hidden');
            isValid = false;
        }
        else {
            subRoleError.classList.add('hidden');
        }

        return isValid;
    }

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
            if (subRoles[user.role]) {
                const subRoleObj = subRoles[user.role].find(sr => sr.value === user.subRole);
                subRoleDisplay = subRoleObj ? subRoleObj.label : user.subRole;
            }

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

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});
