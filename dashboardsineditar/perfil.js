document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const profileTitle = document.getElementById('profileTitle'); // New: Reference to the title
    const imageEasterEggModal = document.getElementById('imageEasterEggModal'); // New: Reference to the image modal
    const closeImageEasterEggModal = document.getElementById('closeImageEasterEggModal'); // New: Reference to the close button

    let titleClickCount = 0; // New: Click counter for the title
    let titleClickTimer; // New: Timer for title clicks

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

    // New: Event listener for the profile title
    if (profileTitle) {
        profileTitle.addEventListener('click', function() {
            titleClickCount++;

            clearTimeout(titleClickTimer);
            titleClickTimer = setTimeout(() => {
                titleClickCount = 0; // Reset count if clicks are too slow
            }, 500); // 500ms window for rapid clicks

            if (titleClickCount >= 3) {
                showImageEasterEggModal();
                titleClickCount = 0; // Reset count after triggering
            }
        });
    }

    // New: Event listener for the close button of the image modal
    if (closeImageEasterEggModal) {
        closeImageEasterEggModal.addEventListener('click', hideImageEasterEggModal);
    }

    // New: Event listener to close image modal when clicking outside its content
    if (imageEasterEggModal) {
        imageEasterEggModal.addEventListener('click', (e) => {
            if (e.target === imageEasterEggModal) {
                hideImageEasterEggModal();
            }
        });
    }

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
     * Muestra el modal del Easter Egg de la imagen.
     */
    function showImageEasterEggModal() {
        if (imageEasterEggModal) {
            imageEasterEggModal.style.display = 'flex';
            // Add a small delay to allow the modal to become 'display: flex' before applying active class
            setTimeout(() => {
                imageEasterEggModal.classList.add('active');
            }, 50);
        }
    }

    /**
     * Oculta el modal del Easter Egg de la imagen.
     */
    function hideImageEasterEggModal() {
        if (imageEasterEggModal) {
            imageEasterEggModal.classList.remove('active');
            // Add a small delay to allow the transition to complete before hiding
            setTimeout(() => {
                imageEasterEggModal.style.display = 'none';
            }, 500); // Match this with the CSS transition duration
        }
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
