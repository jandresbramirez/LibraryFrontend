class ProfileController {
    constructor(userService, authService, loanService) {
        this.userService = userService;
        this.authService = authService;
        this.loanService = loanService;
        this.currentUser = null;
        console.log('✅ ProfileController instanciado');
    }

    async init() {
        console.log('🎯 ProfileController.init() ejecutado');
        try {
            console.log('🔍 Iniciando carga de perfil...');
            await this.loadUserProfile();
            console.log('🔍 Iniciando setup de event listeners...');
            this.setupEventListeners();
            console.log('🔍 Iniciando carga de préstamos...');
            await this.loadUserLoans();
            console.log('🔍 Iniciando setup de UI...');
            this.setupUI();
            console.log('✅ ProfileController init completado exitosamente');
        } catch (error) {
            console.error('❌ Error en ProfileController.init:', error);
            this.showMessage('Error al cargar el perfil', 'error');
        }
    }

    async loadUserProfile() {
        console.log('🔍 loadUserProfile llamado - INICIO');
        try {
            console.log('🔍 Llamando userService.getCurrentUserProfile()...');
            const result = await this.userService.getCurrentUserProfile();
            console.log('📡 Resultado de getCurrentUserProfile:', result);
            
            if (result.success) {
                this.currentUser = result.user;
                console.log('✅ Usuario cargado:', this.currentUser);
                this.displayUserInfo(this.currentUser);
                this.populateUpdateForm(this.currentUser);
            } else {
                console.error('❌ Error del servicio:', result.error);
                this.showMessage('Error cargando perfil: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('❌ Excepción en loadUserProfile:', error);
            this.showMessage('Error de conexión al cargar perfil', 'error');
        }
        console.log('🔍 loadUserProfile llamado - FIN');
    }

    async loadUserLoans() {
        console.log('🔍 loadUserLoans llamado - INICIO');
        try {
            console.log('🔍 Llamando loanService.getUserLoans()...');
            const result = await this.loanService.getUserLoans();
            console.log('📡 Resultado de getUserLoans:', result);
            
            if (result.success) {
                this.displayUserLoans(result.loans);
                this.updateLoanStats(result.loans);
            } else {
                console.log('ℹ️  No se pudieron cargar préstamos:', result.error);
                // Mostrar estado vacío
                this.displayUserLoans([]);
            }
        } catch (error) {
            console.error('❌ Excepción en loadUserLoans:', error);
            // Mostrar estado vacío
            this.displayUserLoans([]);
        }
        console.log('🔍 loadUserLoans llamado - FIN');
    }

    setupEventListeners() {
        console.log('🔍 setupEventListeners llamado');
        
        const updateForm = document.getElementById('update-profile-form');
        if (updateForm) {
            updateForm.addEventListener('submit', (e) => this.handleUpdateProfile(e));
            console.log('✅ Event listener agregado a update-profile-form');
        } else {
            console.error('❌ update-profile-form no encontrado');
        }

        const resetBtn = document.getElementById('reset-form-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.populateUpdateForm(this.currentUser));
        }

        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExportData());
        }

        const changePwdBtn = document.getElementById('change-password-btn');
        if (changePwdBtn) {
            changePwdBtn.addEventListener('click', () => this.handleChangePassword());
        }

        const deleteBtn = document.getElementById('delete-account-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDeleteAccount());
        }
    }

    setupUI() {
        console.log('🔍 setupUI llamado');
        const userWelcome = document.getElementById('user-welcome');
        if (userWelcome && this.currentUser) {
            userWelcome.textContent = `Hola, ${this.currentUser.name}`;
            console.log('✅ Welcome message actualizado');
        }
    }

    displayUserInfo(user) {
        console.log('🔍 displayUserInfo llamado con:', user);
        
        const nameElement = document.getElementById('profile-name');
        const emailElement = document.getElementById('profile-email');
        const idElement = document.getElementById('profile-id');
        
        if (nameElement) nameElement.textContent = user.name || 'No disponible';
        if (emailElement) emailElement.textContent = user.email || 'No disponible';
        if (idElement) idElement.textContent = user.id || '--';

        console.log('✅ Información de usuario mostrada');
        
        // Badge de rol
        const roleBadge = document.getElementById('role-badge');
        if (roleBadge) {
            const role = this.authService.getUserRole();
            console.log('🔍 Rol del usuario:', role);
            
            const roleColors = {
                'admin': 'bg-purple-100 text-purple-800 border border-purple-200',
                'editor': 'bg-blue-100 text-blue-800 border border-blue-200',
                'user': 'bg-green-100 text-green-800 border border-green-200'
            };

            roleBadge.className = `inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${roleColors[role] || 'bg-gray-100 text-gray-800'}`;
            roleBadge.innerHTML = `
                <i class="fas ${role === 'admin' ? 'fa-crown' : role === 'editor' ? 'fa-edit' : 'fa-user'} mr-1"></i>
                ${role ? role.toUpperCase() : 'USUARIO'}
            `;
        }
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