class AuthorService {
    constructor(authService) {
        this.authService = authService;
        this.baseURL = 'https://vigilant-spoon-q7qw9r9r7qpwc49r5-5000.app.github.dev';
    }

    async getAllAuthors() {
        try {
            // ✅ Este endpoint NO requiere autenticación (según tu controller)
            const response = await fetch(`${this.baseURL}/authors`);

            if (response.ok) {
                return { success: true, authors: await response.json() };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getAuthorById(authorId) {
        try {
            // ✅ Este endpoint SÍ requiere autenticación
            const response = await fetch(`${this.baseURL}/authors/${authorId}`, {
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                return { success: true, author: await response.json() };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async createAuthor(authorData) {
        try {
            // ✅ Requiere autenticación y rol admin o editor
            if (!this.authService.hasRole(['admin', 'editor'])) {
                return { success: false, error: 'No tienes permisos para crear autores' };
            }

            const response = await fetch(`${this.baseURL}/authors`, {
                method: 'POST',
                headers: this.authService.getAuthHeaders(),
                body: JSON.stringify(authorData)
            });

            if (response.status === 201) {
                return { success: true, author: await response.json() };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async updateAuthor(authorId, authorData) {
        try {
            // ✅ Requiere autenticación y rol admin o editor
            if (!this.authService.hasRole(['admin', 'editor'])) {
                return { success: false, error: 'No tienes permisos para actualizar autores' };
            }

            const response = await fetch(`${this.baseURL}/authors/${authorId}`, {
                method: 'PUT',
                headers: this.authService.getAuthHeaders(),
                body: JSON.stringify(authorData)
            });

            if (response.ok) {
                return { success: true, author: await response.json() };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async deleteAuthor(authorId) {
        try {
            // ✅ Requiere autenticación y rol admin
            if (!this.authService.isAdmin()) {
                return { success: false, error: 'Solo los administradores pueden eliminar autores' };
            }

            const response = await fetch(`${this.baseURL}/authors/${authorId}`, {
                method: 'DELETE',
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                return { success: true, message: 'Autor eliminado correctamente' };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }
}