class UserService {
    constructor(authService) {
        this.authService = authService;
        this.baseURL = window.APP_CONFIG?.API_BASE_URL || 
                      'https://vigilant-spoon-q7qw9r9r7qpwc49r5-5000.app.github.dev';
    }

    async getAllUsers() {
        try {
            // ✅ Requiere autenticación y rol admin
            if (!this.authService.isAdmin()) {
                return { success: false, error: 'No tienes permisos para ver todos los usuarios' };
            }

            const response = await fetch(`${this.baseURL}/users`, {
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                return { success: true, users: await response.json() };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getCurrentUserProfile() {
        try {
            console.log('🔍 getCurrentUserProfile called');
            
            const userId = this.authService.getUserId();
            console.log('🔍 User ID from authService:', userId);
            
            if (!userId) {
                console.error('❌ No user ID available');
                return { success: false, error: 'Usuario no autenticado' };
            }

            console.log('🔍 Getting profile for user ID:', userId);
            
            // ✅ Usa el endpoint existente /users/{id}
            const result = await this.getUserById(parseInt(userId));
            console.log('🔍 Result from getUserById:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Error in getCurrentUserProfile:', error);
            return { success: false, error: 'Error obteniendo perfil' };
        }
    }

    async getUserById(userId) {
        try {
            // ✅ Requiere autenticación y rol admin, editor o user
            // Los usuarios normales solo pueden ver su propio perfil
            if (this.authService.isUser()) {
                const currentUserId = this.authService.getUserId();
                if (parseInt(userId) !== parseInt(currentUserId)) {
                    return { success: false, error: 'Solo puedes ver tu propio perfil' };
                }
            }

            const response = await fetch(`${this.baseURL}/users/${userId}`, {
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                return { success: true, user: await response.json() };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getUserByEmail(email) {
        try {
            // ✅ Requiere autenticación y rol admin o editor
            if (!this.authService.hasRole(['admin', 'editor'])) {
                return { success: false, error: 'No tienes permisos para buscar usuarios por email' };
            }

            const response = await fetch(`${this.baseURL}/users/${email}`, {
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                return { success: true, user: await response.json() };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async createUser(userData) {
        try {
            // ✅ Este endpoint NO requiere autenticación (es el registro público)
            const response = await fetch(`${this.baseURL}/registry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (response.status === 201) {
                return { success: true, user: await response.json() };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async updateUser(userId, userData) {
        try {
            // Si el usuario es 'user' y está actualizando su propio perfil, usar endpoint /profile
            if (this.authService.isUser() && parseInt(userId) === parseInt(this.authService.getUserId())) {
                console.log('🔍 Usuario actualizando su propio perfil, usando endpoint /profile');
                
                const response = await fetch(`${this.baseURL}/profile`, {
                    method: 'PUT',
                    headers: this.authService.getAuthHeaders(),
                    body: JSON.stringify(userData)
                });

                if (response.ok) {
                    return { success: true, user: await response.json() };
                } else {
                    const error = await response.json();
                    return { success: false, error: error.error };
                }
            }

            // Para admin/editor o usuarios actualizando otros perfiles, usar el endpoint normal
            const response = await fetch(`${this.baseURL}/users/${userId}`, {
                method: 'PUT',
                headers: this.authService.getAuthHeaders(),
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                return { success: true, user: await response.json() };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async deleteUser(userId) {
        try {
            // ✅ Requiere autenticación y rol admin
            if (!this.authService.isAdmin()) {
                return { success: false, error: 'Solo los administradores pueden eliminar usuarios' };
            }

            const response = await fetch(`${this.baseURL}/users/${userId}`, {
                method: 'DELETE',
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                return { success: true, message: 'Usuario eliminado correctamente' };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getCurrentUserProfile() {
        try {
            const userId = this.authService.getUserId();
            if (!userId) {
                return { success: false, error: 'Usuario no autenticado' };
            }

            return await this.getUserById(userId);
        } catch (error) {
            return { success: false, error: 'Error obteniendo perfil' };
        }
    }

    async searchUsers(query) {
        try {
            // Obtener todos los usuarios y filtrar localmente
            const result = await this.getAllUsers();
            if (!result.success) return result;

            const filteredUsers = result.users.filter(user =>
                user.name.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())
            );

            return { success: true, users: filteredUsers };
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }
}