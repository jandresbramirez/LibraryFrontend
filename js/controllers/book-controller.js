class BookController {
    constructor(bookService, authService, authorService) {
        this.bookService = bookService;
        this.authService = authService;
        this.authorService = authorService;
        this.authors = []; // Cache de autores para los selects
    }

    init() {
        this.setupBookEvents();
        this.loadAllBooks();
        this.loadAuthorsForSelects();
    }

    setupBookEvents() {
        // Botón para crear libro
        const createBookForm = document.getElementById('create-book-form');
        if (createBookForm) {
            createBookForm.addEventListener('submit', (e) => this.handleCreateBook(e));
        }

        // Botón para actualizar libro
        const updateBookForm = document.getElementById('update-book-form');
        if (updateBookForm) {
            updateBookForm.addEventListener('submit', (e) => this.handleUpdateBook(e));
        }

        // Botón para buscar libro
        const searchBookForm = document.getElementById('search-book-form');
        if (searchBookForm) {
            searchBookForm.addEventListener('submit', (e) => this.handleSearchBook(e));
        }

        // Búsqueda en tiempo real
        const searchInput = document.getElementById('search-books-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
        }

        // Botón para buscar por autor
        const searchByAuthorForm = document.getElementById('search-by-author-form');
        if (searchByAuthorForm) {
            searchByAuthorForm.addEventListener('submit', (e) => this.handleSearchByAuthor(e));
        }
    }

    async loadAllBooks() {
        const result = await this.bookService.getAllBooks();

        if (result.success) {
            this.displayBooks(result.books);
            this.updateBooksCount(result.books.length);
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    async loadAuthorsForSelects() {
        const result = await this.authorService.getAllAuthors();
        if (result.success) {
            this.authors = result.authors;
            this.populateAuthorSelects();
        }
    }

    populateAuthorSelects() {
        // Llenar select de crear libro
        const createAuthorSelect = document.getElementById('book-author-id');
        if (createAuthorSelect) {
            createAuthorSelect.innerHTML = `
                <option value="">Selecciona un autor</option>
                ${this.authors.map(author => 
                    `<option value="${author.id}">${author.name}</option>`
                ).join('')}
            `;
        }

        // Llenar select de buscar por autor
        const searchAuthorSelect = document.getElementById('search-author-id');
        if (searchAuthorSelect) {
            searchAuthorSelect.innerHTML = `
                <option value="">Todos los autores</option>
                ${this.authors.map(author => 
                    `<option value="${author.id}">${author.name}</option>`
                ).join('')}
            `;
        }
    }

    async handleCreateBook(event) {
        event.preventDefault();
        
        const title = document.getElementById('book-title').value;
        const authorId = document.getElementById('book-author-id').value;

        if (!title || !authorId) {
            this.showMessage('Título y autor son obligatorios', 'error');
            return;
        }

        this.setLoading('create-book-btn', true, 'Creando...');

        const result = await this.bookService.createBook({ 
            title, 
            author_id: parseInt(authorId) 
        });

        if (result.success) {
            this.showMessage(`Libro "${result.book.title}" creado exitosamente`, 'success');
            document.getElementById('create-book-form').reset();
            this.loadAllBooks(); // Recargar la lista
        } else {
            this.showMessage(result.error, 'error');
        }

        this.setLoading('create-book-btn', false, 'Crear Libro');
    }

    async handleUpdateBook(event) {
        event.preventDefault();
        
        const bookId = document.getElementById('update-book-id').value;
        const title = document.getElementById('update-book-title').value;
        const authorId = document.getElementById('update-book-author-id').value;

        if (!bookId) {
            this.showMessage('ID del libro es obligatorio', 'error');
            return;
        }

        const bookData = {};
        if (title) bookData.title = title;
        if (authorId) bookData.author_id = parseInt(authorId);

        if (Object.keys(bookData).length === 0) {
            this.showMessage('Debes proporcionar al menos un campo para actualizar', 'error');
            return;
        }

        this.setLoading('update-book-btn', true, 'Actualizando...');

        const result = await this.bookService.updateBook(parseInt(bookId), bookData);

        if (result.success) {
            this.showMessage(`Libro "${result.book.title}" actualizado exitosamente`, 'success');
            document.getElementById('update-book-form').reset();
            this.loadAllBooks(); // Recargar la lista
        } else {
            this.showMessage(result.error, 'error');
        }

        this.setLoading('update-book-btn', false, 'Actualizar Libro');
    }

    async handleSearchBook(event) {
        event.preventDefault();
        
        const bookId = document.getElementById('search-book-id').value;

        if (!bookId) {
            this.showMessage('Por favor ingresa un ID de libro', 'error');
            return;
        }

        this.setLoading('search-book-btn', true, 'Buscando...');

        const result = await this.bookService.getBookById(parseInt(bookId));

        if (result.success) {
            this.displayBookDetail(result.book);
        } else {
            this.showMessage(result.error, 'error');
            document.getElementById('book-detail').classList.add('hidden');
        }

        this.setLoading('search-book-btn', false, 'Buscar Libro');
    }

    async handleSearchInput(event) {
        const query = event.target.value.trim();
        
        if (query.length === 0) {
            this.loadAllBooks();
            return;
        }

        if (query.length < 2) return; // Esperar al menos 2 caracteres

        // Debounce para no hacer muchas requests
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(async () => {
            const result = await this.bookService.searchBooks(query);
            if (result.success) {
                this.displayBooks(result.books);
                this.updateBooksCount(result.books.length, ` para "${query}"`);
            }
        }, 300);
    }

    async handleSearchByAuthor(event) {
        event.preventDefault();
        
        const authorId = document.getElementById('search-author-id').value;

        if (!authorId) {
            this.loadAllBooks();
            return;
        }

        this.setLoading('search-by-author-btn', true, 'Buscando...');

        const result = await this.bookService.getBooksByAuthor(parseInt(authorId));

        if (result.success) {
            this.displayBooks(result.books);
            const author = this.authors.find(a => a.id == authorId);
            this.updateBooksCount(result.books.length, ` del autor "${author?.name}"`);
        } else {
            this.showMessage(result.error, 'error');
        }

        this.setLoading('search-by-author-btn', false, 'Buscar por Autor');
    }

    async deleteBook(bookId, bookTitle) {
        if (!confirm(`¿Estás seguro de que quieres eliminar el libro "${bookTitle}"?`)) {
            return;
        }

        const result = await this.bookService.deleteBook(bookId);

        if (result.success) {
            this.showMessage(result.message, 'success');
            this.loadAllBooks(); // Recargar la lista
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    displayBooks(books) {
        const container = document.getElementById('books-container');
        
        if (!books || books.length === 0) {
            container.innerHTML = `
                <div class="col-span-2 text-center py-12 text-gray-500">
                    <i class="fas fa-book-open text-4xl mb-4 opacity-50"></i>
                    <p class="text-lg">No se encontraron libros</p>
                    <p class="text-sm mt-2">Intenta con otros criterios de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = books.map(book => `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 book-card hover:shadow-md transition-shadow duration-200">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg text-gray-800 mb-2">${book.title}</h3>
                        <div class="flex items-center text-sm text-gray-600 mb-1">
                            <i class="fas fa-user-edit mr-2 text-green-500"></i>
                            <span>${book.author_name || 'Autor no especificado'}</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-500">
                            <i class="fas fa-hashtag mr-2 text-blue-500"></i>
                            <span>ID: ${book.id}</span>
                            <span class="mx-2">•</span>
                            <i class="fas fa-user mr-1 text-purple-500"></i>
                            <span>Autor ID: ${book.author_id}</span>
                        </div>
                    </div>
                    <div class="flex space-x-2 ml-4">
                        ${this.authService.hasRole(['admin', 'editor']) ? `
                            <button onclick="bookController.showEditBookModal(${book.id}, '${book.title}', ${book.author_id})" 
                                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition duration-200 flex items-center">
                                <i class="fas fa-edit mr-1"></i>Editar
                            </button>
                        ` : ''}
                        ${this.authService.isAdmin() ? `
                            <button onclick="bookController.deleteBook(${book.id}, '${book.title}')" 
                                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition duration-200 flex items-center">
                                <i class="fas fa-trash mr-1"></i>Eliminar
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                    <span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                        <i class="fas fa-book mr-1"></i>Libro
                    </span>
                    <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ${book.author_name || 'Sin autor'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    displayBookDetail(book) {
        const detailContainer = document.getElementById('book-detail');
        detailContainer.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-md border border-blue-200">
                <h3 class="text-xl font-semibold text-blue-600 mb-4 flex items-center">
                    <i class="fas fa-info-circle mr-2"></i>Detalle del Libro
                </h3>
                <div class="space-y-4">
                    <div>
                        <label class="font-semibold text-gray-700 block mb-1">Título:</label>
                        <p class="text-gray-800 text-lg">${book.title}</p>
                    </div>
                    <div>
                        <label class="font-semibold text-gray-700 block mb-1">Autor:</label>
                        <p class="text-gray-600">${book.author_name || 'No especificado'}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="font-semibold text-gray-700 block mb-1">ID del Libro:</label>
                            <p class="text-gray-600">${book.id}</p>
                        </div>
                        <div>
                            <label class="font-semibold text-gray-700 block mb-1">ID del Autor:</label>
                            <p class="text-gray-600">${book.author_id || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        detailContainer.classList.remove('hidden');
    }

    updateBooksCount(count, suffix = '') {
        const countElement = document.getElementById('books-count');
        if (countElement) {
            countElement.textContent = `${count} libros encontrados${suffix}`;
        }
    }

    showEditBookModal(bookId, currentTitle, currentAuthorId) {
        // Podrías implementar un modal más elaborado aquí
        const newTitle = prompt('Editar título del libro:', currentTitle);
        if (newTitle && newTitle !== currentTitle) {
            this.bookService.updateBook(bookId, { title: newTitle })
                .then(result => {
                    if (result.success) {
                        this.showMessage('Libro actualizado correctamente', 'success');
                        this.loadAllBooks();
                    } else {
                        this.showMessage(result.error, 'error');
                    }
                });
        }
    }

    setLoading(buttonId, loading, loadingText = 'Cargando...') {
        const button = document.getElementById(buttonId);
        if (button) {
            if (loading) {
                button.disabled = true;
                button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> ${loadingText}`;
            } else {
                button.disabled = false;
                const originalText = button.getAttribute('data-original-text') || button.textContent;
                button.innerHTML = originalText;
            }
        }
    }

    showMessage(message, type) {
        const alertClass = type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800';

        const messageDiv = document.createElement('div');
        messageDiv.className = `${alertClass} border rounded-lg p-4 mb-4 shadow-lg`;
        messageDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas ${type === 'success' ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500'} mr-3"></i>
                    <span>${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        const booksSection = document.getElementById('books-section');
        if (booksSection) {
            booksSection.insertBefore(messageDiv, booksSection.firstChild);
        }

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}