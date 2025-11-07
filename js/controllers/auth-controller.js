class AuthController {
    constructor() {
        this.authService = new AuthService();
        this.isLoading = false;

        // ✅ VERIFICAR que los servicios tengan la URL correcta
        console.log('AuthService URL:', this.authService.baseURL);
    }

    init() {
        this.setupTabs();
        this.setupLoginForm();
        this.setupRegisterForm();

        // ✅ DEBUG: Verificar que los botones existen
        console.log('Login button:', document.getElementById('login-btn'));
        console.log('Register button:', document.getElementById('register-btn'));
        
        // Verificar parámetros de URL para mostrar registro directamente
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        if (action === 'register') {
            this.showRegister();
        }
    }

    setupTabs() {
        document.getElementById('login-tab').addEventListener('click', () => this.showLogin());
        document.getElementById('register-tab').addEventListener('click', () => this.showRegister());
    }

    setupLoginForm() {
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    }

    setupRegisterForm() {
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
    }

    showLogin() {
        if (this.isLoading) return;
        
        document.getElementById('login-form-container').classList.remove('hidden');
        document.getElementById('register-form-container').classList.add('hidden');
        
        document.getElementById('login-tab').classList.add('border-indigo-500', 'text-indigo-600');
        document.getElementById('login-tab').classList.remove('text-gray-500', 'border-transparent');
        
        document.getElementById('register-tab').classList.remove('border-indigo-500', 'text-indigo-600');
        document.getElementById('register-tab').classList.add('text-gray-500', 'border-transparent');
    }

    showRegister() {
        if (this.isLoading) return;
        
        document.getElementById('login-form-container').classList.add('hidden');
        document.getElementById('register-form-container').classList.remove('hidden');
        
        document.getElementById('register-tab').classList.add('border-indigo-500', 'text-indigo-600');
        document.getElementById('register-tab').classList.remove('text-gray-500', 'border-transparent');
        
        document.getElementById('login-tab').classList.remove('border-indigo-500', 'text-indigo-600');
        document.getElementById('login-tab').classList.add('text-gray-500', 'border-transparent');
    }

    async handleLogin(event) {
        event.preventDefault();
        if (this.isLoading) return;

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Validación básica
        if (!email || !password) {
            this.showMessage('Por favor completa todos los campos', 'error');
            return;
        }

        this.setLoading('login', true);

        const result = await this.authService.login({ email, password });

        if (result.success) {
            // ✅ GUARDAR DATOS DEL USUARIO después del login exitoso
            await this.loadAndStoreUserData();
            
            this.showMessage('¡Bienvenido a la biblioteca!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            this.showMessage(result.error, 'error');
        }

        this.setLoading('login', false);
    }

    async loadAndStoreUserData() {
        try {
            // ✅ Obtener el perfil del usuario después del login
            const userService = new UserService(this.authService);
            const userResult = await userService.getCurrentUserProfile();
            
            if (userResult.success) {
                // ✅ Guardar datos del usuario en localStorage
                localStorage.setItem('user_name', userResult.user.name);
                localStorage.setItem('user_email', userResult.user.email);
                localStorage.setItem('user_id', userResult.user.id);
                console.log('✅ Datos de usuario guardados:', userResult.user);
            } else {
                console.warn('⚠️ No se pudieron cargar los datos del usuario:', userResult.error);
            }
        } catch (error) {
            console.error('❌ Error cargando datos del usuario:', error);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        if (this.isLoading) return;

        const userData = {
            name: document.getElementById('register-name').value,
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value
        };

        // Validación
        if (!userData.name || !userData.email || !userData.password) {
            this.showMessage('Todos los campos son obligatorios', 'error');
            return;
        }

        if (userData.password.length < 6) {
            this.showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        this.setLoading('register', true);

        const result = await this.authService.register(userData);

        if (result.success) {
            this.showMessage('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.', 'success');
            setTimeout(() => {
                this.showLogin();
                document.getElementById('register-form').reset();
            }, 2000);
        } else {
            this.showMessage(result.error, 'error');
        }

        this.setLoading('register', false);
    }

    setLoading(formType, loading) {
        this.isLoading = loading;
        
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');

        // ✅ VERIFICACIÓN de que los botones existen
        if (!loginBtn || !registerBtn) {
            console.error('❌ Botones no encontrados');
            return;
        }

        if (formType === 'login') {
            if (loading) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Iniciando sesión...';
            } else {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<span id="login-btn-text">Iniciar Sesión</span><i class="fas fa-sign-in-alt ml-2"></i>';
            }
        } else {
            if (loading) {
                registerBtn.disabled = true;
                registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creando cuenta...';
            } else {
                registerBtn.disabled = false;
                registerBtn.innerHTML = '<span id="register-btn-text">Crear Cuenta</span><i class="fas fa-user-plus ml-2"></i>';
            }
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