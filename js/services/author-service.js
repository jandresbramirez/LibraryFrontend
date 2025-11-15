class AuthorService {
    constructor(authService) {
        this.authService = authService;
        this.baseURL = window.APP_CONFIG?.API_BASE_URL || 
                      'https://vigilant-spoon-q7qw9r9r7qpwc49r5-5000.app.github.dev';
    }

    // ✅ Headers completos para requests autenticadas
    // ✅ Headers mejorados
    getRequestHeaders() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('⚠️ No hay token disponible');
        }
        
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    async getAllAuthors() {
        try {
            const response = await fetch(`${this.baseURL}/authors`);
            
            if (response.ok) {
                const authors = await response.json();
                return { success: true, authors };
            } else {
                const error = await response.json();
                return { success: false, error: error.error || 'Error al obtener autores' };
            }
        } catch (error) {
            console.error('Error en getAllAuthors:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getAuthorById(authorId) {
        try {
            const response = await fetch(`${this.baseURL}/authors/${authorId}`, {
                headers: this.getRequestHeaders()
            });

            if (response.ok) {
                const author = await response.json();
                return { success: true, author };
            } else {
                const error = await response.json();
                return { success: false, error: error.error || 'Error al buscar autor' };
            }
        } catch (error) {
            console.error('Error en getAuthorById:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    async createAuthor(authorData) {
        try {
            console.log('🔍 Iniciando createAuthor...');
            
            // ✅ VERIFICACIÓN CORREGIDA
            if (!this.authService.hasRole(['admin', 'editor'])) {
                const userRole = this.authService.getUserRole();
                console.log(`❌ Permisos insuficientes. Rol actual: ${userRole}, Requerido: admin o editor`);
                return { success: false, error: 'No tienes permisos para crear autores. Se requiere rol admin o editor.' };
            }

            // ✅ Verificar autenticación
            if (!this.authService.isAuthenticated()) {
                console.log('❌ Usuario no autenticado');
                return { success: false, error: 'Debes iniciar sesión para realizar esta acción' };
            }

            console.log('🔍 Enviando datos:', authorData);
            console.log('🔍 Headers:', this.getRequestHeaders());

            const response = await fetch(`${this.baseURL}/authors`, {
                method: 'POST',
                headers: this.getRequestHeaders(),
                body: JSON.stringify(authorData)
            });

            console.log('🔍 Response status:', response.status);
            
            const responseText = await response.text();
            console.log('🔍 Response body:', responseText);

            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = { error: 'Respuesta no válida del servidor' };
            }

            if (response.ok || response.status === 201) {
                console.log('✅ Autor creado exitosamente:', responseData);
                return { success: true, author: responseData };
            } else {
                console.log('❌ Error del servidor:', responseData);
                return { 
                    success: false, 
                    error: responseData.error || responseData.message || 'Error al crear autor' 
                };
            }

        } catch (error) {
            console.error('🔍 Error de conexión:', error);
            return { success: false, error: 'Error de conexión con el servidor' };
        }
    }
    
    async updateAuthor(authorId, authorData) {
        try {
            if (!this.authService.hasRole(['admin', 'editor'])) {
                return { success: false, error: 'No tienes permisos para actualizar autores' };
            }

            const response = await fetch(`${this.baseURL}/authors/${authorId}`, {
                method: 'PUT',
                headers: this.getRequestHeaders(),
                body: JSON.stringify(authorData)
            });

            if (response.ok) {
                const author = await response.json();
                return { success: true, author };
            } else {
                const error = await response.json();
                return { success: false, error: error.error || 'Error al actualizar autor' };
            }
        } catch (error) {
            console.error('Error en updateAuthor:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    async deleteAuthor(authorId) {
        try {
            if (!this.authService.isAdmin()) {
                return { success: false, error: 'Solo los administradores pueden eliminar autores' };
            }

            const response = await fetch(`${this.baseURL}/authors/${authorId}`, {
                method: 'DELETE',
                headers: this.getRequestHeaders()
            });

            if (response.ok) {
                return { success: true, message: 'Autor eliminado correctamente' };
            } else {
                const error = await response.json();
                return { success: false, error: error.error || 'Error al eliminar autor' };
            }
        } catch (error) {
            console.error('Error en deleteAuthor:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }
}