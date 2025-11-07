class UserController {
    constructor(userService, authService) {
        this.userService = userService;
        this.authService = authService;
        this.users = [];
    }

    init() {
        // Verificar permisos de administrador
        if (!this.authService.isAdmin()) {
            this.showMessage('No tienes permisos de administrador', 'error');
            return;
        }

        this.setupEventListeners();
        this.loadAllUsers();
    }

    setupEventListeners() {
        // Formulario de crear usuario
        const createUserForm = document.getElementById('create-user-form');
        if (createUserForm) {
            createUserForm.addEventListener('submit', (e) => this.handleCreateUser(e));
        }

        // Formulario de buscar usuario
        const searchUserForm = document.getElementById('search-user-form');
        if (searchUserForm) {
            searchUserForm.addEventListener('submit', (e) => this.handleSearchUser(e));
        }

        // Botones de acción
        const refreshBtn = document.getElementById('refresh-users-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadAllUsers());
        }

        const exportBtn = document.getElementById('export-users-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExportUsers());
        }
    }

    async loadAllUsers() {
        this.setLoading('refresh-users-btn', true, 'Cargando...');

        const result = await this.userService.getAllUsers();

        if (result.success) {
            this.users = result.users;
            this.displayUsers(this.users);
            this.updateUsersCount(this.users.length);
        } else {
            this.showMessage(result.error, 'error');
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

        // NOTA: Usamos createUser que es el endpoint público /registry
        // En un sistema real, podrías necesitar un endpoint admin específico
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
        const container = document.getElementById('users-container');
        const tbody = document.getElementById('users-table-body');
        
        // Para tabla en admin.html
        if (tbody) {
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
                            <button onclick="userController.editUser(${user.id})" 
                                    class="text-indigo-600 hover:text-indigo-900 transition duration-200 flex items-center">
                                <i class="fas fa-edit mr-1"></i>Editar
                            </button>
                            <button onclick="userController.deleteUser(${user.id}, '${user.name}')" 
                                    class="text-red-600 hover:text-red-900 transition duration-200 flex items-center">
                                <i class="fas fa-trash mr-1"></i>Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
        
        // Para grid en otras páginas
        if (container) {
            if (!users || users.length === 0) {
                container.innerHTML = `
                    <div class="col-span-2 text-center py-12 text-gray-500">
                        <i class="fas fa-users text-4xl mb-4 opacity-50"></i>
                        <p>No se encontraron usuarios</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = users.map(user => `
                <div class="bg-white p-6 rounded-lg shadow border">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-semibold text-lg">${user.name}</h3>
                            <p class="text-gray-600">${user.email}</p>
                            <p class="text-sm text-gray-500">ID: ${user.id}</p>
                            <span class="inline-block mt-2 px-2 py-1 text-xs rounded-full ${this.getRoleBadgeClass(user.role)}">
                                ${this.getRoleDisplayName(user.role)}
                            </span>
                        </div>
                        ${this.authService.isAdmin() ? `
                            <button onclick="userController.deleteUser(${user.id}, '${user.name}')" 
                                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                Eliminar
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }
    }

    getRoleBadgeClass(role) {
        const classes = {
            'admin': 'bg-purple-100 text-purple-800 border border-purple-200',
            'editor': 'bg-blue-100 text-blue-800 border border-blue-200',
            'user': 'bg-green-100 text-green-800 border border-green-200'
        };
        return classes[role] || 'bg-gray-100 text-gray-800 border border-gray-200';
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

        // Modal simple de edición
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
        messageDiv.className = `${alertClass} border rounded-lg p-4 mb-4 shadow-lg max-w-sm`;
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
        if (container) {
            container.appendChild(messageDiv);
        } else {
            // Si no hay container, agregar al body
            messageDiv.className += ' fixed top-4 right-4 z-50';
            document.body.appendChild(messageDiv);
        }

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Hacer disponible globalmente
window.userController = null;