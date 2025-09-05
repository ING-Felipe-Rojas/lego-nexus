document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const darkModeToggle = document.getElementById('darkModeToggle');

    // --- Inicialización ---
    fetchUserDetails();

    // Inicializar el modo oscuro si está guardado
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.querySelector('i').classList.replace('fa-sun', 'fa-moon');
    }

    // --- Event Listeners ---
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

    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        updateProfile();
    });

    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        updatePassword();
    });

    // --- Funciones ---

    /**
     * Obtiene los detalles del usuario actual y puebla el formulario de perfil.
     */
    function fetchUserDetails() {
        fetch('api/get_user_details.php', {
            headers: { 'Accept': 'application/json' }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const userData = result.data;
                document.getElementById('profileName').value = userData.USR_NOMBRE || '';
                document.getElementById('profileEmail').value = userData.USR_CORREO || '';
                document.getElementById('profilePhone').value = userData.USR_TELEFONO || '';
            } else {
                showToast(result.error || 'No se pudieron cargar los datos del perfil.', 'error');
            }
        })
        .catch(error => {
            console.error('Error al cargar el perfil:', error);
            showToast('Error de conexión al cargar el perfil.', 'error');
        });
    }

    /**
     * Envía los datos actualizados del perfil al servidor.
     */
    function updateProfile() {
        const profileData = {
            name: document.getElementById('profileName').value,
            email: document.getElementById('profileEmail').value,
            phone: document.getElementById('profilePhone').value
        };

        fetch('api/actualizar_perfil.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(profileData)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast(result.message || 'Perfil actualizado correctamente.', 'success');
            } else {
                showToast(result.error || 'No se pudo actualizar el perfil.', 'error');
            }
        })
        .catch(error => {
            console.error('Error al actualizar el perfil:', error);
            showToast('Error de conexión al actualizar el perfil.', 'error');
        });
    }

    /**
     * Envía los datos del formulario de cambio de contraseña al servidor.
     */
    function updatePassword() {
        const passwordData = {
            currentPassword: document.getElementById('currentPassword').value,
            newPassword: document.getElementById('newPassword').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('La nueva contraseña y la confirmación no coinciden.', 'error');
            return;
        }

        fetch('api/cambiar_password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(passwordData)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast(result.message || 'Contraseña actualizada correctamente.', 'success');
                passwordForm.reset(); // Limpiar el formulario
            } else {
                showToast(result.error || 'No se pudo cambiar la contraseña.', 'error');
            }
        })
        .catch(error => {
            console.error('Error al cambiar la contraseña:', error);
            showToast('Error de conexión al cambiar la contraseña.', 'error');
        });
    }

    /**
     * Muestra una notificación Toastify.
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
});