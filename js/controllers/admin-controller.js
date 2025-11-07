class AdminController {
    constructor(userService, authService) {
        this.userService = userService;
        this.authService = authService;
        this.users = [];
    }

    async init() {
        // Verificar que el usuario sea administrador
        if (!this.authService.isAdmin()) {
            this.showMessage('No tienes permisos de administrador', 'error');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return;
        }

        this.setupEventListeners();
        await this.loadAllUsers();
        this.setupStats();
    }

    setupEventListeners() {
        // Formulario de crear usuario
        document.getElementById('create-user-form').addEventListener('submit', 
            (e) => this.handleCreateUser(e)
        );

        // Formulario de buscar usuario
        document.getElementById('search-user-form').addEventListener('submit', 
            (e) => this.handleSearchUser(e)
        );

        // Botones de acción
        document.getElementById('refresh-users-btn').addEventListener('click', 
            () => this.loadAllUsers()
        );

        document.getElementById('export-users-btn').addEventListener('click', 
            () => this.handleExportUsers()
        );

        // Configuración del sistema
        this.setupSystemSettings();
    }

    setupSystemSettings() {
        // Aquí podrías cargar la configuración actual del sistema
        // Por ahora son placeholders
        const maintenanceMode = document.getElementById('maintenance-mode');
        const activityLogging = document.getElementById('activity-logging');
        const loanDuration = document.getElementById('loan-duration');

        if (maintenanceMode) {
            maintenanceMode.addEventListener('change', (e) => {
                this.showMessage('Modo mantenimiento ' + (e.target.checked ? 'activado' : 'desactivado'), 'info');
            });
        }

        if (activityLogging) {
            activityLogging.addEventListener('change', (e) => {
                this.showMessage('Registro de actividad ' + (e.target.checked ? 'activado' : 'desactivado'), 'info');
            });
        }

        if (loanDuration) {
            loanDuration.addEventListener('change', (e) => {
                this.showMessage('Duración de préstamos actualizada a ' + e.target.value + ' días', 'info');
            });
        }
    }

    async loadAllUsers() {
        this.setLoading('refresh-users-btn', true, 'Cargando...');

        const result = await this.userService.getAllUsers();

        if (result.success) {
            this.users = result.users;
            this.displayUsers(this.users);
            this.updateUsersCount(this.users.length);
            this.updateStats();
        } else {
            this.showMessage('Error cargando usuarios: ' + result.error, 'error');
        }

        this.setLoading('refresh-users-btn', false, 'Actualizar');
    }

    async handleCreateUser(event) {
        event.preventDefault();
        
        const name = document.getElementById('admin-user-name').value;
        const email = document.getElementById('admin-user-email').value;
        const password = document.getElementById('admin-user-password').value;
        const role = document.getElementById('admin-user-role').value;

        // Validación
        if (!name || !email || !password) {
            this.showMessage('Todos los campos son obligatorios', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        this.setLoading('create-user-btn', true, 'Creando...');

        const userData = { name, email, password, role };

        const result = await this.userService.createUser(userData);

        if (result.success) {
            this.showMessage(`Usuario "${name}" creado exitosamente como ${role}`, 'success');
            document.getElementById('create-user-form').reset();
            await this.loadAllUsers(); // Recargar la lista
        } else {
            this.showMessage('Error creando usuario: ' + result.error, 'error');
        }

        this.setLoading('create-user-btn', false, 'Crear Usuario');
    }

    async handleSearchUser(event) {
        event.preventDefault();
        
        const searchType = document.getElementById('search-user-type').value;
        const searchValue = document.getElementById('search-user-value').value;

        if (!searchValue) {
            this.showMessage('Por favor ingresa un valor para buscar', 'error');
            return;
        }

        this.setLoading('search-user-btn', true, 'Buscando...');

        let result;
        if (searchType === 'id') {
            result = await this.userService.getUserById(parseInt(searchValue));
        } else {
            result = await this.userService.getUserByEmail(searchValue);
        }

        if (result.success) {
            this.displayUsers([result.user]); // Mostrar solo el usuario encontrado
            this.updateUsersCount(1, ' encontrado');
        } else {
            this.showMessage(result.error, 'error');
            await this.loadAllUsers(); // Volver a cargar todos los usuarios
        }

        this.setLoading('search-user-btn', false, 'Buscar Usuario');
    }

    displayUsers(users) {
        const tbody = document.getElementById('users-table-body');
        
        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                        <i class="fas fa-users text-3xl mb-2 opacity-50"></i>
                        <p>No se encontraron usuarios</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr class="hover:bg-gray-50 transition duration-150">
                <td class="px-4 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-indigo-600"></i>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${user.name}</div>
                            <div class="text-sm text-gray-500">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getRoleBadgeClass(user.role)}">
                        ${this.getRoleDisplayName(user.role)}
                    </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${user.id}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                    </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="adminController.editUser(${user.id})" 
                                class="text-indigo-600 hover:text-indigo-900 transition duration-200 flex items-center">
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                        <button onclick="adminController.deleteUser(${user.id}, '${user.name}')" 
                                class="text-red-600 hover:text-red-900 transition duration-200 flex items-center">
                            <i class="fas fa-trash mr-1"></i>Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getRoleBadgeClass(role) {
        const classes = {
            'admin': 'bg-purple-100 text-purple-800',
            'editor': 'bg-blue-100 text-blue-800',
            'user': 'bg-green-100 text-green-800'
        };
        return classes[role] || 'bg-gray-100 text-gray-800';
    }

    getRoleDisplayName(role) {
        const names = {
            'admin': 'Administrador',
            'editor': 'Editor',
            'user': 'Usuario'
        };
        return names[role] || role;
    }

    async editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Podrías implementar un modal de edición aquí
        const newName = prompt('Editar nombre del usuario:', user.name);
        const newEmail = prompt('Editar email del usuario:', user.email);
        const newRole = prompt('Editar rol (admin/editor/user):', user.role);

        if (newName && newEmail && newRole && 
            (newName !== user.name || newEmail !== user.email || newRole !== user.role)) {
            
            const updateData = {};
            if (newName !== user.name) updateData.name = newName;
            if (newEmail !== user.email) updateData.email = newEmail;
            if (newRole !== user.role) updateData.role = newRole;

            const result = await this.userService.updateUser(userId, updateData);
            
            if (result.success) {
                this.showMessage('Usuario actualizado correctamente', 'success');
                await this.loadAllUsers();
            } else {
                this.showMessage('Error actualizando usuario: ' + result.error, 'error');
            }
        }
    }

    async deleteUser(userId, userName) {
        if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${userName}"?`)) {
            return;
        }

        if (confirm('Esta acción no se puede deshacer. ¿Continuar?')) {
            const result = await this.userService.deleteUser(userId);
            
            if (result.success) {
                this.showMessage('Usuario eliminado correctamente', 'success');
                await this.loadAllUsers();
            } else {
                this.showMessage('Error eliminando usuario: ' + result.error, 'error');
            }
        }
    }

    updateUsersCount(count, suffix = '') {
        const countElement = document.getElementById('users-count');
        if (countElement) {
            countElement.textContent = `${count} usuarios${suffix}`;
        }
    }

    updateStats() {
        // Estadísticas de usuarios
        const totalUsers = this.users.length;
        const adminUsers = this.users.filter(u => u.role === 'admin').length;
        const editorUsers = this.users.filter(u => u.role === 'editor').length;
        const regularUsers = this.users.filter(u => u.role === 'user').length;

        document.getElementById('stats-total-users').textContent = totalUsers;
        
        // Aquí podrías cargar más estadísticas desde otros servicios
        // Por ahora usamos datos de ejemplo
        document.getElementById('stats-total-books').textContent = '1,247';
        document.getElementById('stats-active-loans').textContent = '89';
        document.getElementById('stats-overdue-loans').textContent = '12';
    }

    setupStats() {
        // Inicializar estadísticas
        this.updateStats();
        
        // Aquí podrías cargar estadísticas en tiempo real
        // desde diferentes servicios (books, loans, etc.)
    }

    handleExportUsers() {
        // Crear CSV con datos de usuarios
        const headers = ['ID', 'Nombre', 'Email', 'Rol', 'Estado'];
        const csvData = this.users.map(user => [
            user.id,
            `"${user.name}"`,
            `"${user.email}"`,
            user.role,
            'Activo'
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.join(','))
            .join('\n');

        // Crear y descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `usuarios_biblioteca_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showMessage('Reporte de usuarios exportado correctamente', 'success');
    }

    setLoading(buttonId, loading, loadingText = 'Cargando...') {
        const button = document.getElementById(buttonId);
        if (button) {
            if (loading) {
                button.disabled = true;
                const originalText = button.innerHTML;
                button.setAttribute('data-original-text', originalText);
                button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> ${loadingText}`;
            } else {
                button.disabled = false;
                const originalText = button.getAttribute('data-original-text') || button.innerHTML;
                button.innerHTML = originalText;
            }
        }
    }

    showMessage(message, type) {
        const alertClass = type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800'
            : type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800';

        const icon = type === 'success' 
            ? 'fa-check-circle text-green-500'
            : type === 'error' 
            ? 'fa-exclamation-circle text-red-500'
            : 'fa-info-circle text-blue-500';

        const messageDiv = document.createElement('div');
        messageDiv.className = `${alertClass} border rounded-lg p-4 mb-4 shadow-lg max-w-sm transform transition-all duration-300 ease-in-out`;
        messageDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas ${icon} mr-3"></i>
                    <span class="flex-1">${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600 ml-4">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        const container = document.getElementById('message-container');
        container.appendChild(messageDiv);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Métodos para las diferentes pestañas del admin
    async loadSystemStats() {
        // Aquí cargarías estadísticas del sistema
        // Por ahora son placeholders
        return {
            totalUsers: this.users.length,
            totalBooks: 1247,
            activeLoans: 89,
            overdueLoans: 12,
            systemUptime: '99.8%',
            storageUsage: '2.3 GB'
        };
    }

    async generateReport(reportType) {
        this.showMessage(`Generando reporte de ${reportType}...`, 'info');
        
        // Simular generación de reporte
        setTimeout(() => {
            this.showMessage(`Reporte de ${reportType} generado correctamente`, 'success');
            
            // Aquí podrías implementar la descarga real del reporte
            const link = document.createElement('a');
            link.setAttribute('download', `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, 2000);
    }

    async performSystemAction(action) {
        switch (action) {
            case 'backup':
                this.showMessage('Iniciando respaldo de base de datos...', 'info');
                // Implementar respaldo
                break;
            case 'reindex':
                this.showMessage('Reindexando buscador...', 'info');
                // Implementar reindexación
                break;
            case 'clear-cache':
                this.showMessage('Limpiando cache del sistema...', 'info');
                // Implementar limpieza de cache
                break;
            case 'reset-system':
                if (confirm('¿ESTÁS ABSOLUTAMENTE SEGURO? Esto restablecerá todo el sistema a valores predeterminados.')) {
                    this.showMessage('Restableciendo sistema...', 'warning');
                    // Implementar restablecimiento
                }
                break;
        }
    }
}

// Hacer disponible globalmente para los onclick
window.adminController = null;

document.addEventListener('DOMContentLoaded', () => {
    // La inicialización se hace en el script del HTML
});