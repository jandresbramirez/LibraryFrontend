class DashboardController {
    constructor() {
        this.authService = new AuthService();
        this.userService = new UserService(this.authService);
    }

    init() {
        this.setupLogout();
        this.setupUI();
        this.loadUserData();
        this.loadDashboardStats();
    }

    setupLogout() {
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
    }

    setupUI() {
        const userRole = this.authService.getUserRole();
        const userName = localStorage.getItem('user_name') || 'Usuario';
        
        // Actualizar información del usuario
        document.getElementById('user-welcome').textContent = `Hola, ${userName}`;
        document.getElementById('user-role').textContent = userRole;
        document.getElementById('welcome-message').textContent = `Bienvenido de vuelta, ${userName}`;
        document.getElementById('role-badge').textContent = `Rol: ${userRole}`;

        // Mostrar/ocultar elementos según rol
        if (this.authService.isAdmin()) {
            document.getElementById('admin-actions').classList.remove('hidden');
            document.getElementById('admin-nav-mobile').classList.remove('hidden');
        }

        // Añadir badges de rol con colores
        this.setupRoleBadges(userRole);
    }

    setupRoleBadges(role) {
        const roleBadge = document.getElementById('role-badge');
        const colors = {
            'admin': 'bg-purple-100 text-purple-800 border-purple-200',
            'editor': 'bg-blue-100 text-blue-800 border-blue-200',
            'user': 'bg-green-100 text-green-800 border-green-200'
        };

        roleBadge.innerHTML = `
            <span class="px-2 py-1 rounded-full text-xs font-medium border ${colors[role] || 'bg-gray-100 text-gray-800'}">
                <i class="fas fa-${role === 'admin' ? 'crown' : role === 'editor' ? 'edit' : 'user'} mr-1"></i>
                ${role.toUpperCase()}
            </span>
        `;
    }

    async loadUserData() {
        const result = await this.userService.getCurrentUserProfile();
        if (result.success) {
            this.displayUserInfo(result.user);
            // Guardar nombre para uso en la UI
            localStorage.setItem('user_name', result.user.name);
            document.getElementById('user-welcome').textContent = `Hola, ${result.user.name}`;
            document.getElementById('welcome-message').textContent = `Bienvenido de vuelta, ${result.user.name}`;
        } else {
            this.displayUserInfoError();
        }
    }

    async loadDashboardStats() {
        // Aquí cargarías las estadísticas reales de tu API
        // Por ahora usaremos datos de ejemplo
        setTimeout(() => {
            document.getElementById('total-books').textContent = '1,247';
            document.getElementById('total-authors').textContent = '356';
            document.getElementById('active-loans').textContent = '89';
            document.getElementById('total-users').textContent = '2,841';
        }, 1000);
    }

    displayUserInfo(user) {
        const userInfoDiv = document.getElementById('user-info');
        userInfoDiv.innerHTML = `
            <div class="text-center mb-4">
                <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-user text-indigo-600 text-2xl"></i>
                </div>
                <h3 class="font-semibold text-lg text-gray-800">${user.name}</h3>
                <p class="text-gray-600 text-sm">${user.email}</p>
            </div>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">ID de Usuario:</span>
                    <span class="font-medium">${user.id}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Rol:</span>
                    <span class="font-medium capitalize">${this.authService.getUserRole()}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Miembro desde:</span>
                    <span class="font-medium">2024</span>
                </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-200">
                <a href="profile.html" class="block w-full bg-indigo-600 text-white text-center py-2 rounded-lg hover:bg-indigo-700 transition duration-200">
                    <i class="fas fa-edit mr-2"></i>Editar Perfil
                </a>
            </div>
        `;
    }

    displayUserInfoError() {
        const userInfoDiv = document.getElementById('user-info');
        userInfoDiv.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Error cargando información del usuario</p>
            </div>
        `;
    }

    async handleLogout() {
        const result = await this.authService.logout();
        if (result.success) {
            this.showMessage('Sesión cerrada correctamente', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    showMessage(message, type) {
        const container = document.getElementById('message-container');
        
        // Limpiar mensajes anteriores
        container.innerHTML = '';

        const alertClass = type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800';

        const icon = type === 'success' 
            ? 'fas fa-check-circle text-green-500'
            : 'fas fa-exclamation-circle text-red-500';

        const messageDiv = document.createElement('div');
        messageDiv.className = `${alertClass} border rounded-lg p-4 mb-4 shadow-lg max-w-sm transform transition-all duration-300 ease-in-out`;
        messageDiv.innerHTML = `
            <div class="flex items-center">
                <i class="${icon} mr-3"></i>
                <span class="flex-1">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600 ml-4">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(messageDiv);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}