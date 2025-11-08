class AuthService {
    constructor() {
        this.baseURL = 'https://vigilant-spoon-q7qw9r9r7qpwc49r5-5000.app.github.dev';
    }

    async login(credentials) {
        try {
            console.log('🔍 LOGIN INICIADO - Credentials:', credentials);
            
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            console.log('🔍 Login response status:', response.status);
            
            const data = await response.json();
            console.log('🔍 Login response data:', data);

            if (response.ok) {
                console.log('✅ Login successful, processing token...');
                
                // Guardar token
                localStorage.setItem('token', data.access_token);
                console.log('🔍 Token saved to localStorage');
                
                // ✅ OBTENER user_id PRIMERO DEL TOKEN (siempre disponible)
                console.log('🔍 Calling getUserIdFromToken...');
                const userIdFromToken = this.getUserIdFromToken(data.access_token);
                console.log('🔍 Calling getRoleFromToken...');
                const userRoleFromToken = this.getRoleFromToken(data.access_token);
                
                console.log('🔍 User ID from token:', userIdFromToken);
                console.log('🔍 User Role from token:', userRoleFromToken);
                
                // ✅ GUARDAR DATOS PRINCIPALES DESDE EL TOKEN
                localStorage.setItem('user_id', userIdFromToken);
                localStorage.setItem('user_role', userRoleFromToken);
                console.log('🔍 user_id and user_role saved to localStorage');
                
                // ✅ GUARDAR DATOS ADICIONALES DEL USUARIO SI VIENEN EN LA RESPUESTA
                if (data.user) {
                    console.log('🔍 User data found in response:', data.user);
                    localStorage.setItem('user_name', data.user.name || '');
                    localStorage.setItem('user_email', data.user.email || '');
                } else {
                    console.log('🔍 No user data in response');
                }
                
                console.log('✅ LOGIN COMPLETADO - Final Storage:');
                console.log('- user_id:', localStorage.getItem('user_id'));
                console.log('- user_role:', localStorage.getItem('user_role'));
                console.log('- user_name:', localStorage.getItem('user_name'));
                console.log('- token:', !!localStorage.getItem('token'));
                
                return { success: true, token: data.access_token, user: data.user };
            } else {
                console.log('❌ Login failed:', data.error);
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('❌ Login exception:', error);
            return { success: false, error: 'Error de conexión con el servidor' };
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/registry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.status === 201) {
                return { success: true, user: data };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión con el servidor' };
        }
    }

    async logout() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Limpiar localStorage independientemente de la respuesta del servidor
            localStorage.removeItem('token');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_id');
            
            if (response.ok) {
                return { success: true, message: 'Sesión cerrada correctamente' };
            } else {
                return { success: false, error: 'Error al cerrar sesión' };
            }
        } catch (error) {
            // Limpiar localStorage incluso si hay error de conexión
            localStorage.removeItem('token');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_id');
            return { success: false, error: 'Error de conexión' };
        }
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    isAuthenticated() {
        return localStorage.getItem('token') !== null;
    }

    getUserRole() {
        return localStorage.getItem('user_role');
    }

    getUserId() {
        return localStorage.getItem('user_id');
    }

    getRoleFromToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('🔍 Token payload for role:', payload);
            
            // ✅ Role está en "role"
            const role = payload.role;
            console.log('🔍 Role from token:', role);
            
            return role;
        } catch (error) {
            console.error('❌ Error decoding token for role:', error);
            return null;
        }
    }

    getUserIdFromToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('🔍 Token payload for user ID:', payload);
            
            // ✅ El user_id está en "sub", no en "identity"
            const userId = payload.sub; // Esto devuelve "8"
            console.log('🔍 User ID from sub field:', userId);
            
            return userId;
        } catch (error) {
            console.error('❌ Error decoding token for user ID:', error);
            return null;
        }
    }

    isAdmin() {
        return this.getUserRole() === 'admin';
    }

    isEditor() {
        return this.getUserRole() === 'editor';
    }

    isUser() {
        return this.getUserRole() === 'user';
    }

    hasRole(requiredRoles) {
        const userRole = this.getUserRole();
        return requiredRoles.includes(userRole);
    }
}