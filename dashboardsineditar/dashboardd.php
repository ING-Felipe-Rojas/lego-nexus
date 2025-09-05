<?php
session_start();

// VERIFICACIÓN DE SEGURIDAD ESTÁNDAR Y CORRECTA:
// El script 'login.php' es el único que comprueba la contraseña. Si tiene éxito,
// crea la variable de sesión 'user_id'.
// Ahora, esta página solo necesita comprobar si esa marca de 'autenticado' existe.

if (!isset($_SESSION['user_id'])) {
    // Si 'user_id' no existe en la sesión, significa que el usuario NUNCA ha iniciado sesión.
    // Se le redirige a la página de login y se detiene la ejecución del script.
    header("Location: logo-animado/HTML/newlogin.html");
    exit;
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sistema de Administración de Usuarios</title>
    <!-- Enlace a la librería Tailwind CSS para estilos de utilidad -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <!-- Enlace a Font Awesome para iconos -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Enlace a Toastify JS para notificaciones tipo "toast" -->
    <link href="https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify.min.css" rel="stylesheet">
    <!-- Enlace a la hoja de estilos personalizada -->
    <link rel="stylesheet" href="style.css"> <!-- Enlace al CSS externo -->
</head>
<body class="bg-gray-100">
<div class="flex flex-col h-screen">
    <!-- Header: Contiene el botón para alternar el sidebar y el título principal de la aplicación -->
    <header class="header flex items-center justify-between px-6 shadow-md">
        <div class="flex items-center">
            <button id="sidebarToggleBtn" class="text-white text-2xl mr-4 focus:outline-none">
                <i class="fas fa-bars"></i>
            </button>
            <h1 class="text-xl font-bold text-white">Gestion de usuarios</h1>
        </div>
        <div class="flex items-center">
            <button id="darkModeToggle" class="text-white text-2xl mr-4 focus:outline-none">
                <i class="fas fa-moon"></i>
            </button>
            <img id="unapLogo" src="https://www.unap.cl/prontus_unap/imag/logo_unap_2022-07_blanco.png" alt="Logo UNAP" class="h-10">
        </div>
    </header>

    <!-- Main Content Area: Contiene el sidebar y el área principal de contenido -->
    <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar: Menú de navegación lateral con opciones de filtro y creación de usuario -->
        <aside id="sidebar" class="sidebar text-white overflow-y-auto flex flex-col">
            <div class="p-4">
                <!-- Botón de Perfil -->
                <a href="perfil.php" class="role-item flex items-center justify-start mb-6">
                    <i class="fas fa-user-cog mr-2"></i> <span class="sidebar-text">Perfil</span>
                </a>
                <!-- Botón de Inicio -->
                <a href="dashboardd.php" class="role-item flex items-center justify-start mb-2">
                    <i class="fas fa-home mr-2"></i> <span class="sidebar-text">Inicio</span>
                </a>
                <!-- Sección de filtros por rol -->
                <div class="mb-4">
                    <h3 class="font-bold mb-2"><span class="sidebar-text">Filtros</span></h3>

                    <!-- Contenedor para el rol de Alumnos -->
                    <div class="role-container mb-2">
                        <div class="role-item flex items-center justify-between" data-role="alumnos">
                            <i class="fas fa-user-graduate mr-2"></i> <span class="sidebar-text">Alumnos</span>
                        </div>
                        <!-- Sub-roles de Alumnos (ocultos temporalmente) -->
                        <div class="sub-role" id="alumnos-sub" style="display: none;">
                            <div class="role-item" data-subrole="vigente">
                                <i class="fas fa-check-circle mr-2"></i> <span class="sidebar-text">Vigente</span>
                            </div>
                            <div class="role-item" data-subrole="titulado">
                                <i class="fas fa-graduation-cap mr-2"></i> <span class="sidebar-text">Titulado</span>
                            </div>
                            <div class="role-item" data-subrole="egresado">
                                <i class="fas fa-user-clock mr-2"></i> <span class="sidebar-text">Egresado</span>
                            </div>
                        </div>
                    </div>

                    <!-- Contenedor para el rol de Funcionarios -->
                    <div class="role-container mb-2">
                        <div class="role-item flex items-center justify-between" data-role="funcionarios">
                            <i class="fas fa-user-tie mr-2"></i> <span class="sidebar-text">Funcionarios</span>
                        </div>
                        <!-- Sub-roles de Funcionarios (ocultos temporalmente) -->
                        <div class="sub-role" id="funcionarios-sub" style="display: none;">
                            <div class="role-item" data-subrole="administrativo">
                                <i class="fas fa-briefcase mr-2"></i> <span class="sidebar-text">Administrativo</span>
                            </div>
                            <div class="role-item" data-subrole="docente">
                                <i class="fas fa-chalkboard-teacher mr-2"></i> <span class="sidebar-text">Docente</span>
                            </div>
                            <div class="role-item" data-subrole="directivo">
                                <i class="fas fa-user-shield mr-2"></i> <span class="sidebar-text">Directivo</span>
                            </div>
                        </div>
                    </div>

                    <!-- Contenedor para el rol de Externos -->
                    <div class="role-container mb-2">
                        <div class="role-item flex items-center justify-between" data-role="externos">
                            <i class="fas fa-user-friends mr-2"></i> <span class="sidebar-text">Externos</span>
                        </div>
                        <!-- Sub-roles de Externos (ocultos temporalmente) -->
                        <div class="sub-role" id="externos-sub" style="display: none;">
                            <div class="role-item" data-subrole="proveedor">
                                <i class="fas fa-truck mr-2"></i> <span class="sidebar-text">Proveedor</span>
                            </div>
                            <div class="role-item" data-subrole="invitado">
                                <i class="fas fa-handshake mr-2"></i> <span class="sidebar-text">Invitado</span>
                            </div>
                            <div class="role-item" data-subrole="convenio">
                                <i class="fas fa-file-contract mr-2"></i> <span class="sidebar-text">Convenio</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div class="p-4 mt-auto">
                <button id="logoutBtn" class="btn-danger py-2 px-4 rounded-md mx-auto block">
                    <i class="fas fa-sign-out-alt mr-2"></i> <span class="sidebar-text">Cerrar Sesión</span>
                </button>
            </div>
        </aside>

        <!-- Main Area: Contenido principal de la aplicación -->
        <main class="flex-1 p-6 overflow-y-auto">
            
            <!-- Sección SGU_USUARIO (Oracle): Muestra datos obtenidos de la API PHP -->
            <div class="bg-white rounded-lg shadow-md p-6 w-full mt-6">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center space-x-4">
                        <!-- Campo de búsqueda de usuarios -->
                        <div class="relative">
                            <input type="text" id="searchInput" placeholder="Buscar usuarios..." class="form-control pr-10">
                            <i id="searchIcon" class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"></i>
                        </div>
                        <!-- Botón para abrir el modal de creación de usuario -->
                        <button id="createUserBtn" class="btn-primary flex items-center justify-center ml-4">
                            <i class="fas fa-plus mr-2"></i> Crear Usuario
                        </button>
                    </div>
                    <!-- Controles para el límite de filas y botón de carga de datos de Oracle -->
                    <div class="flex items-center space-x-3">
                        <input id="oracleLimit" type="number" min="1" max="1000" value="100" class="form-control w-24" title="Límite de filas">
                        <button id="loadOracleBtn" class="btn-primary">Cargar</button>
                    </div>
                </div>
                <!-- Área para mostrar el estado de la carga de datos de Oracle -->
                <p id="oracleStatus" class="text-sm text-gray-500 mb-3"></p>

                <!-- Contenedor de la tabla de usuarios de Oracle -->
                <div class="table-container">
                    <table id="oracleTable">
                        <thead></thead>
                        <tbody></tbody>
                    </table>
                </div>

                <!-- Mensaje a mostrar cuando no hay datos de Oracle -->
                <div id="oracleNoData" class="hidden text-center py-8 text-gray-500">
                    <i class="fas fa-database text-5xl mb-4"></i>
                    <p>No hay datos para mostrar</p>
                </div>
            </div>
        </main>
    </div>
</div>

<!-- Create/Edit User Modal: Formulario para crear o editar usuarios -->
<div id="userModal" class="modal">
    <div class="modal-content">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 id="modalTitle" class="text-xl font-bold text-gray-800">Crear Usuario</h3>
                <button id="closeModal" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="userForm">
                <input type="hidden" id="userId">

                <!-- Campo para el nombre del usuario -->
                <div class="form-group">
                    <label for="userName" class="block mb-1 font-medium">Nombre</label>
                    <input type="text" id="userName" class="form-control" required>
                    <div id="userNameError" class="error-message hidden">El nombre es requerido</div>
                </div>

                <!-- Campo para el email del usuario -->
                <div class="form-group">
                    <label for="userEmail" class="block mb-1 font-medium">Email</label>
                    <input type="email" id="userEmail" class="form-control" required>
                    <div id="userEmailError" class="error-message hidden">Ingrese un email válido</div>
                </div>

                <!-- Campo para el teléfono del usuario -->
                <div class="form-group">
                    <label for="userPhone" class="block mb-1 font-medium">Teléfono</label>
                    <input type="tel" id="userPhone" class="form-control" required>
                    <div id="userPhoneError" class="error-message hidden">Ingrese un teléfono válido</div>
                </div>

                <!-- Campo para el departamento del usuario -->
                <div class="form-group">
                    <label for="userDepartment" class="block mb-1 font-medium">Departamento</label>
                    <input type="text" id="userDepartment" class="form-control" required>
                    <div id="userDepartmentError" class="error-message hidden">El departamento es requerido</div>
                </div>

                <!-- Campo para el rol del usuario (select) -->
                <div class="form-group">
                    <label for="userRole" class="block mb-1 font-medium">Rol</label>
                    <select id="userRole" class="form-control" required>
                        <option value="">Seleccione un rol</option>
                        <option value="alumnos">Alumnos</option>
                        <option value="funcionarios">Funcionarios</option>
                        <option value="externos">Externos</option>
                    </select>
                    <div id="userRoleError" class="error-message hidden">Seleccione un rol</div>
                </div>

                <!-- Campo para el sub-rol del usuario (oculto temporalmente) -->
                <div class="form-group" style="display: none;">
                    <label for="userSubRole" class="block mb-1 font-medium">Sub-Rol</label>
                    <select id="userSubRole" class="form-control" required disabled>
                        <option value="">Seleccione un sub-rol</option>
                        <!-- Las opciones se poblarán dinámicamente si se habilita -->
                    </select>
                    <div id="userSubRoleError" class="error-message hidden">Seleccione un sub-rol</div>
                </div>

                <!-- Botones de acción del formulario (Cancelar y Guardar) -->
                <div class="flex justify-end mt-6 space-x-4">
                    <button type="button" id="cancelBtn" class="btn-secondary">Cancelar</button>
                    <button type="submit" id="saveBtn" class="btn-primary">
                        <span id="saveSpinner" class="loading-spinner hidden"></span>
                        <span id="saveText">Guardar</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal: Modal para confirmar la eliminación de un usuario -->
<div id="deleteModal" class="modal">
    <div class="modal-content w-96">
        <div class="p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Confirmar Eliminación</h3>
            <p>¿Estás seguro que deseas eliminar al usuario <span id="deleteUserName" class="font-semibold"></span>?</p>
            <p class="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>

            <div class="flex justify-end mt-6 space-x-4">
                <button id="cancelDeleteBtn" class="btn-secondary">Cancelar</button>
                <button id="confirmDeleteBtn" class="btn-danger">
                    <span id="deleteSpinner" class="loading-spinner hidden"></span>
                    <span id="deleteText">Eliminar</span>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Logout Confirmation Modal -->
<div id="logoutModal" class="modal">
    <div class="modal-content w-96">
        <div class="p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Confirmar Cierre de Sesión</h3>
            <p>¿Estás seguro que deseas cerrar tu sesión?</p>

            <div class="flex justify-end mt-6 space-x-4">
                <button id="cancelLogoutBtn" class="btn-secondary">Cancelar</button>
                <button id="confirmLogoutBtn" class="btn-danger">
                    Cerrar Sesión
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Reset Confirmation Modal: Modal para confirmar el reinicio de todos los datos -->
<div id="resetModal" class="modal">
    <div class="modal-content w-96">
        <div class="p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Confirmar Reinicio</h3>
            <p>¿Estás seguro que deseas reiniciar todos los datos?</p>
            <p class="text-sm text-gray-500 mt-2">Esta acción eliminará todos los usuarios y no se puede deshacer.</p>

            <div class="flex justify-end mt-6 space-x-4">
                <button id="cancelResetBtn" class="btn-secondary">Cancelar</button>
                <button id="confirmResetBtn" class="btn-danger">
                    <span id="resetSpinner" class="loading-spinner hidden"></span>
                    <span id="resetText">Reiniciar</span>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Honorary Mention Modal -->
<div id="honoraryModal" class="modal">
    <div class="modal-content w-96">
        <div class="p-6 text-center">
            <div class="flex justify-end">
                <button id="closeHonoraryModal" class="text-gray-400 hover:text-gray-600 focus:outline-none">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-4">¡Felicitaciones!</h3>
            <p>Has descubierto el huevo de pascua de Matrix.</p>
            <p class="text-sm text-gray-500 mt-2">Mención honorífica por tu curiosidad.</p>
        </div>
    </div>
</div>

<canvas id="matrixCanvas" class="hidden"></canvas>

<!-- Enlace a la librería Toastify JS (para notificaciones) -->
<script src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
<!-- Enlace al archivo JavaScript principal de la aplicación -->
<script src="script.js"></script> <!-- Enlace al JavaScript externo -->
<script src="easter-egg.js"></script>
</body>
</html>