class AuthService {
    constructor() {
        this.baseURL = 'https://vigilant-spoon-q7qw9r9r7qpwc49r5-5000.app.github.dev';
    }

    async login(credentials) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

             if (response.ok) {
            // Guardar token y datos del usuario
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user_role', this.getRoleFromToken(data.access_token));
            localStorage.setItem('user_id', this.getUserIdFromToken(data.access_token));
            
            // ✅ GUARDAR DATOS DEL USUARIO si vienen en la respuesta
            if (data.user) {
                localStorage.setItem('user_name', data.user.name);
                localStorage.setItem('user_email', data.user.email);
            }
                return { success: true, token: data.access_token, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
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
            return payload.role;
        } catch (error) {
            return null;
        }
    }

    getUserIdFromToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.identity;
        } catch (error) {
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