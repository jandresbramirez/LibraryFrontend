class BookService {
    constructor(authService, authorService) {
        this.authService = authService;
        this.authorService = authorService;
        this.baseURL = window.APP_CONFIG?.API_BASE_URL || 
                      'https://vigilant-spoon-q7qw9r9r7qpwc49r5-5000.app.github.dev';
    }

    async getAllBooks() {
        try {
            // ✅ Este endpoint NO requiere autenticación (según tu controller)
            const response = await fetch(`${this.baseURL}/books`);

            if (response.ok) {
                const books = await response.json();
                // Enriquecer libros con información del autor
                const enrichedBooks = await this.enrichBooksWithAuthors(books);
                return { success: true, books: enrichedBooks };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getBookById(bookId) {
        try {
            // ✅ Este endpoint SÍ requiere autenticación
            const response = await fetch(`${this.baseURL}/books/${bookId}`, {
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                const book = await response.json();
                // Enriquecer con información del autor
                const enrichedBook = await this.enrichBookWithAuthor(book);
                return { success: true, book: enrichedBook };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getBooksByAuthor(authorId) {
        try {
            // ✅ Este endpoint SÍ requiere autenticación
            // NOTA: Hay un conflicto en las rutas del backend - mismo patrón para book_id y author_id
            // Sugerencia: Cambiar la ruta a /books/author/<author_id> en el backend
            const response = await fetch(`${this.baseURL}/books/author/${authorId}`, {
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                const books = await response.json();
                const enrichedBooks = await this.enrichBooksWithAuthors(books);
                return { success: true, books: enrichedBooks };
            } else {
                // Si falla, intentar con la ruta alternativa
                return await this.getBooksByAuthorAlternative(authorId);
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getBooksByAuthorAlternative(authorId) {
        try {
            // Método alternativo: obtener todos los libros y filtrar por author_id
            const allBooks = await this.getAllBooks();
            if (allBooks.success) {
                const authorBooks = allBooks.books.filter(book => book.author_id == authorId);
                return { success: true, books: authorBooks };
            }
            return { success: false, error: 'No se pudieron obtener los libros del autor' };
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async createBook(bookData) {
        try {
            // ✅ Requiere autenticación y rol admin o editor
            if (!this.authService.hasRole(['admin', 'editor'])) {
                return { success: false, error: 'No tienes permisos para crear libros' };
            }

            const response = await fetch(`${this.baseURL}/books`, {
                method: 'POST',
                headers: this.authService.getAuthHeaders(),
                body: JSON.stringify(bookData)
            });

            if (response.status === 201) {
                const book = await response.json();
                const enrichedBook = await this.enrichBookWithAuthor(book);
                return { success: true, book: enrichedBook };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async updateBook(bookId, bookData) {
        try {
            // ✅ Requiere autenticación y rol admin o editor
            if (!this.authService.hasRole(['admin', 'editor'])) {
                return { success: false, error: 'No tienes permisos para actualizar libros' };
            }

            const response = await fetch(`${this.baseURL}/books/${bookId}`, {
                method: 'PUT',
                headers: this.authService.getAuthHeaders(),
                body: JSON.stringify(bookData)
            });

            if (response.ok) {
                const book = await response.json();
                const enrichedBook = await this.enrichBookWithAuthor(book);
                return { success: true, book: enrichedBook };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async deleteBook(bookId) {
        try {
            // ✅ Requiere autenticación y rol admin
            if (!this.authService.isAdmin()) {
                return { success: false, error: 'Solo los administradores pueden eliminar libros' };
            }

            const response = await fetch(`${this.baseURL}/books/${bookId}`, {
                method: 'DELETE',
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                return { success: true, message: 'Libro eliminado correctamente' };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    // Métodos auxiliares para enriquecer datos
    async enrichBooksWithAuthors(books) {
        try {
            // Obtener todos los autores para mapear
            const authorsResult = await this.authorService.getAllAuthors();
            if (!authorsResult.success) return books;

            const authorsMap = {};
            authorsResult.authors.forEach(author => {
                authorsMap[author.id] = author.name;
            });

            // Enriquecer cada libro con el nombre del autor
            return books.map(book => ({
                ...book,
                author_name: authorsMap[book.author_id] || 'Autor desconocido'
            }));
        } catch (error) {
            return books;
        }
    }

    async enrichBookWithAuthor(book) {
        try {
            if (!book.author_id) return book;

            const authorResult = await this.authorService.getAuthorById(book.author_id);
            if (authorResult.success) {
                return {
                    ...book,
                    author_name: authorResult.author.name
                };
            }
            return book;
        } catch (error) {
            return book;
        }
    }

    async searchBooks(query) {
        try {
            const allBooks = await this.getAllBooks();
            if (!allBooks.success) return allBooks;

            const filteredBooks = allBooks.books.filter(book =>
                book.title.toLowerCase().includes(query.toLowerCase()) ||
                book.author_name.toLowerCase().includes(query.toLowerCase())
            );

            return { success: true, books: filteredBooks };
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }
}