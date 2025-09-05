<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: logo-animado/HTML/newlogin.html");
    exit;
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Perfil de Usuario - Sistema de Administración</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify.min.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="bg-gray-100">
<div class="flex flex-col h-screen">
    <!-- Header -->
    <header class="header flex items-center justify-between px-6 shadow-md">
        <div class="flex items-center">
            <button id="sidebarToggleBtn" class="text-white text-2xl mr-4 focus:outline-none">
                <i class="fas fa-bars"></i>
            </button>
            <h1 class="text-xl font-bold text-white">Sistema de Administración de Usuarios</h1>
        </div>
        <div class="flex items-center">
            <button id="darkModeToggle" class="text-white text-2xl mr-4 focus:outline-none">
                <i class="fas fa-moon"></i>
            </button>
            <img src="https://www.unap.cl/prontus_unap/imag/logo_unap_2022-07_blanco.png" alt="Logo UNAP" class="h-10">
        </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <aside id="sidebar" class="sidebar text-white overflow-y-auto flex flex-col">
            <div class="p-4">
                <button id="createUserBtn" class="btn-primary w-full flex items-center justify-center mb-2">
                    <i class="fas fa-plus mr-2"></i> <span class="sidebar-text">Crear Usuario</span>
                </button>
                <a href="dashboardd.php" class="role-item flex items-center justify-start mb-2">
                    <i class="fas fa-home mr-2"></i> <span class="sidebar-text">Inicio</span>
                </a>
                <a href="perfil.php" class="role-item flex items-center justify-start mb-6">
                    <i class="fas fa-user-cog mr-2"></i> <span class="sidebar-text">Perfil</span>
                </a>
                <div class="mb-4">
                    <h3 class="font-bold mb-2"><span class="sidebar-text">Filtros</span></h3>
                    <!-- Filtros de roles -->
                </div>
            </div>
            <div class="p-4 mt-auto">
                <a href="logout.php" id="logoutBtn" class="btn-danger w-full flex items-center justify-center">
                    <i class="fas fa-sign-out-alt mr-2"></i> <span class="sidebar-text">Cerrar Sesión</span>
                </a>
            </div>
        </aside>

        <!-- Profile Content -->
        <main class="flex-1 p-6 overflow-y-auto">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h2>

            <!-- Edit Profile Form -->
            <div class="bg-white rounded-lg shadow-md p-6 w-full mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Editar Información Personal</h3>
                <form id="profileForm">
                    <div class="form-group">
                        <label for="profileName" class="block mb-1 font-medium">Nombre</label>
                        <input type="text" id="profileName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="profileEmail" class="block mb-1 font-medium">Email</label>
                        <input type="email" id="profileEmail" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="profilePhone" class="block mb-1 font-medium">Teléfono</label>
                        <input type="tel" id="profilePhone" class="form-control">
                    </div>
                    <div class="flex justify-end mt-6">
                        <button type="submit" id="saveProfileBtn" class="btn-primary">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>

            <!-- Change Password Form -->
            <div class="bg-white rounded-lg shadow-md p-6 w-full">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Cambiar Contraseña</h3>
                <form id="passwordForm">
                    <div class="form-group">
                        <label for="currentPassword" class="block mb-1 font-medium">Contraseña Actual</label>
                        <input type="password" id="currentPassword" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="newPassword" class="block mb-1 font-medium">Nueva Contraseña</label>
                        <input type="password" id="newPassword" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword" class="block mb-1 font-medium">Confirmar Nueva Contraseña</label>
                        <input type="password" id="confirmPassword" class="form-control" required>
                    </div>
                    <div class="flex justify-end mt-6">
                        <button type="submit" id="savePasswordBtn" class="btn-primary">
                            Cambiar Contraseña
                        </button>
                    </div>
                </form>
            </div>
        </main>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
<script src="perfil.js"></script>
</body>
</html>