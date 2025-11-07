class ProfileController {
    constructor(userService, authService, loanService) {
        this.userService = userService;
        this.authService = authService;
        this.loanService = loanService;
        this.currentUser = null;
    }

    async init() {
        await this.loadUserProfile();
        this.setupEventListeners();
        this.loadUserLoans();
        this.setupUI();
    }

    async loadUserProfile() {
        const result = await this.userService.getCurrentUserProfile();
        
        if (result.success) {
            this.currentUser = result.user;
            this.displayUserInfo(this.currentUser);
            this.populateUpdateForm(this.currentUser);
        } else {
            this.showMessage('Error cargando perfil: ' + result.error, 'error');
        }
    }

    async loadUserLoans() {
        const result = await this.loanService.getUserLoans();
        
        if (result.success) {
            this.displayUserLoans(result.loans);
            this.updateLoanStats(result.loans);
        }
    }

    setupEventListeners() {
        // Formulario de actualización
        document.getElementById('update-profile-form').addEventListener('submit', 
            (e) => this.handleUpdateProfile(e)
        );

        // Botón de reset
        document.getElementById('reset-form-btn').addEventListener('click', 
            () => this.populateUpdateForm(this.currentUser)
        );

        // Acciones de cuenta
        document.getElementById('export-data-btn').addEventListener('click',
            () => this.handleExportData()
        );

        document.getElementById('change-password-btn').addEventListener('click',
            () => this.handleChangePassword()
        );

        document.getElementById('delete-account-btn').addEventListener('click',
            () => this.handleDeleteAccount()
        );
    }

    setupUI() {
        // Configurar bienvenida
        const userWelcome = document.getElementById('user-welcome');
        if (userWelcome && this.currentUser) {
            userWelcome.textContent = `Hola, ${this.currentUser.name}`;
        }
    }

    displayUserInfo(user) {
        // Información principal
        document.getElementById('profile-name').textContent = user.name;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-id').textContent = user.id;

        // Badge de rol
        const roleBadge = document.getElementById('role-badge');
        const role = this.authService.getUserRole();
        const roleColors = {
            'admin': 'bg-purple-100 text-purple-800 border border-purple-200',
            'editor': 'bg-blue-100 text-blue-800 border border-blue-200',
            'user': 'bg-green-100 text-green-800 border border-green-200'
        };

        roleBadge.className = `inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${roleColors[role] || 'bg-gray-100 text-gray-800'}`;
        roleBadge.innerHTML = `
            <i class="fas ${role === 'admin' ? 'fa-crown' : role === 'editor' ? 'fa-edit' : 'fa-user'} mr-1"></i>
            ${role.toUpperCase()}
        `;
    }

    populateUpdateForm(user) {
        document.getElementById('update-name').value = user.name || '';
        document.getElementById('update-email').value = user.email || '';
        document.getElementById('update-password').value = '';
    }

    async handleUpdateProfile(event) {
        event.preventDefault();
        
        const name = document.getElementById('update-name').value;
        const email = document.getElementById('update-email').value;
        const password = document.getElementById('update-password').value;

        // Validación
        if (!name || !email) {
            this.showMessage('Nombre y email son obligatorios', 'error');
            return;
        }

        if (password && password.length < 6) {
            this.showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        this.setLoading('update-profile-btn', true, 'Guardando...');

        const updateData = { name, email };
        if (password) {
            updateData.password = password;
        }

        const result = await this.userService.updateUser(this.currentUser.id, updateData);

        if (result.success) {
            this.showMessage('Perfil actualizado correctamente', 'success');
            this.currentUser = result.user;
            this.displayUserInfo(this.currentUser);
            
            // Actualizar nombre en localStorage si cambió
            if (name !== this.currentUser.name) {
                localStorage.setItem('user_name', name);
            }
        } else {
            this.showMessage('Error actualizando perfil: ' + result.error, 'error');
        }

        this.setLoading('update-profile-btn', false, 'Guardar Cambios');
    }

    displayUserLoans(loans) {
        const container = document.getElementById('my-loans-container');
        const noLoansMessage = document.getElementById('no-loans-message');

        const activeLoans = loans.filter(loan => !loan.return_date);

        if (activeLoans.length === 0) {
            container.classList.add('hidden');
            noLoansMessage.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        noLoansMessage.classList.add('hidden');

        container.innerHTML = activeLoans.map(loan => `
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800 mb-1">${loan.book_title || 'Libro no encontrado'}</h4>
                        <p class="text-sm text-gray-600 mb-2">${loan.book_author || 'Autor desconocido'}</p>
                        <div class="flex items-center text-sm text-gray-500">
                            <i class="fas fa-calendar-alt mr-2 text-blue-500"></i>
                            <span>Prestado: ${this.formatDate(loan.loan_date)}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            Activo
                        </span>
                        <div class="text-xs text-gray-500 mt-1">
                            Vence: ${this.formatDate(this.calculateDueDate(loan.loan_date))}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateLoanStats(loans) {
        const activeLoans = loans.filter(loan => !loan.return_date).length;
        const totalLoans = loans.length;
        const returnedLoans = loans.filter(loan => loan.return_date).length;

        document.getElementById('stats-active-loans').textContent = activeLoans;
        document.getElementById('stats-total-loans').textContent = totalLoans;
        document.getElementById('stats-books-read').textContent = returnedLoans;
    }

    handleExportData() {
        this.showMessage('Funcionalidad de exportación en desarrollo', 'info');
        // Aquí implementarías la lógica para exportar datos
    }

    handleChangePassword() {
        document.getElementById('update-password').focus();
        this.showMessage('Ingresa tu nueva contraseña en el formulario superior', 'info');
    }

    handleDeleteAccount() {
        if (!confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
            return;
        }

        if (confirm('¿Realmente estás seguro? Se perderán todos tus datos y préstamos.')) {
            this.showMessage('Funcionalidad de eliminación de cuenta en desarrollo', 'info');
            // Aquí implementarías la lógica para eliminar la cuenta
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    calculateDueDate(loanDate) {
        const date = new Date(loanDate);
        date.setDate(date.getDate() + 30);
        return date.toISOString();
    }

    setLoading(buttonId, loading, loadingText = 'Cargando...') {
        const button = document.getElementById(buttonId);
        if (button) {
            if (loading) {
                button.disabled = true;
                button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> ${loadingText}`;
            } else {
                button.disabled = false;
                button.innerHTML = `<i class="fas fa-save mr-2"></i> Guardar Cambios`;
            }
        }
    }

    showMessage(message, type) {
        const alertClass = type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800'
            : type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800';

        const messageDiv = document.createElement('div');
        messageDiv.className = `${alertClass} border rounded-lg p-4 mb-4 shadow-lg max-w-sm`;
        messageDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas ${type === 'success' ? 'fa-check-circle text-green-500' : type === 'error' ? 'fa-exclamation-circle text-red-500' : 'fa-info-circle text-blue-500'} mr-3"></i>
                    <span>${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        const container = document.getElementById('message-container');
        container.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}