class AuthorController {
    constructor(authorService, authService) {
        this.authorService = authorService;
        this.authService = authService;
    }

    init() {
        this.setupAuthorEvents();
        this.loadAllAuthors(); // Cargar autores automáticamente
    }

    setupAuthorEvents() {
        // Botón para crear autor
        const createAuthorForm = document.getElementById('create-author-form');
        console.log('🔍 createAuthorForm encontrado:', !!createAuthorForm);
        
        if (createAuthorForm) {
            createAuthorForm.addEventListener('submit', (e) => {
                console.log('🎯 Evento submit disparado!');
                this.handleCreateAuthor(e);
            });
        } else {
            console.error('❌ create-author-form NO encontrado en el DOM');
        }

        // Botón para actualizar autor
        const updateAuthorForm = document.getElementById('update-author-form');
        if (updateAuthorForm) {
            updateAuthorForm.addEventListener('submit', (e) => this.handleUpdateAuthor(e));
        }

        // Botón para buscar autor por ID
        const searchAuthorForm = document.getElementById('search-author-form');
        if (searchAuthorForm) {
            searchAuthorForm.addEventListener('submit', (e) => this.handleSearchAuthor(e));
        }
    }

    async loadAllAuthors() {
        const result = await this.authorService.getAllAuthors();

        if (result.success) {
            this.displayAuthors(result.authors);
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    async handleCreateAuthor(event) {
        // ✅ Manejo seguro del event
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        
        try {
            console.log('🎯 handleCreateAuthor ejecutado');
            
            const nameInput = document.getElementById('author-name');
            const name = nameInput ? nameInput.value.trim() : '';
            console.log('🔍 Nombre capturado:', name);

            if (!name) {
                this.showMessage('El nombre del autor es obligatorio', 'error');
                return;
            }

            this.setLoading('create-author-btn', true, 'Creando...');

            const result = await this.authorService.createAuthor({ name });
            console.log('🔍 Resultado de createAuthor:', result);

            if (result.success) {
                this.showMessage(`Autor "${result.author.name}" creado exitosamente`, 'success');
                if (document.getElementById('create-author-form')) {
                    document.getElementById('create-author-form').reset();
                }
                this.loadAllAuthors();
            } else {
                this.showMessage(result.error, 'error');
            }

        } catch (error) {
            console.error('❌ Error en handleCreateAuthor:', error);
            this.showMessage('Error al crear autor: ' + error.message, 'error');
        } finally {
            this.setLoading('create-author-btn', false, 'Crear Autor');
        }
    }

    async handleUpdateAuthor(event) {
        event.preventDefault();
        
        const authorId = document.getElementById('update-author-id').value;
        const name = document.getElementById('update-author-name').value;

        if (!authorId || !name) {
            this.showMessage('ID y nombre del autor son obligatorios', 'error');
            return;
        }

        this.setLoading('update-author-btn', true, 'Actualizando...');

        const result = await this.authorService.updateAuthor(parseInt(authorId), { name });

        if (result.success) {
            this.showMessage(`Autor "${result.author.name}" actualizado exitosamente`, 'success');
            document.getElementById('update-author-form').reset();
            this.loadAllAuthors(); // Recargar la lista
        } else {
            this.showMessage(result.error, 'error');
        }

        this.setLoading('update-author-btn', false, 'Actualizar Autor');
    }

    async handleSearchAuthor(event) {
        event.preventDefault();
        
        const authorId = document.getElementById('search-author-id').value;

        if (!authorId) {
            this.showMessage('Por favor ingresa un ID de autor', 'error');
            return;
        }

        this.setLoading('search-author-btn', true, 'Buscando...');

        const result = await this.authorService.getAuthorById(parseInt(authorId));

        if (result.success) {
            this.displayAuthorDetail(result.author);
        } else {
            this.showMessage(result.error, 'error');
            document.getElementById('author-detail').classList.add('hidden');
        }

        this.setLoading('search-author-btn', false, 'Buscar Autor');
    }

    async deleteAuthor(authorId, authorName) {
        if (!confirm(`¿Estás seguro de que quieres eliminar al autor "${authorName}"?`)) {
            return;
        }

        const result = await this.authorService.deleteAuthor(authorId);

        if (result.success) {
            this.showMessage(result.message, 'success');
            this.loadAllAuthors(); // Recargar la lista
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    displayAuthors(authors) {
        const container = document.getElementById('authors-container');
        
        if (!authors || authors.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4 opacity-50"></i>
                    <p>No hay autores registrados en el sistema.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = authors.map(author => `
            <div class="bg-white p-4 rounded-lg shadow border border-gray-200 author-card">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg text-gray-800">${author.name}</h3>
                        <p class="text-sm text-gray-500 mt-1">ID: ${author.id}</p>
                    </div>
                    <div class="flex space-x-2 ml-4">
                        ${this.authService.hasRole(['admin', 'editor']) ? `
                            <button onclick="authorController.showEditAuthorModal(${author.id}, '${author.name}')" 
                                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition duration-200">
                                <i class="fas fa-edit mr-1"></i>Editar
                            </button>
                        ` : ''}
                        ${this.authService.isAdmin() ? `
                            <button onclick="authorController.deleteAuthor(${author.id}, '${author.name}')" 
                                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition duration-200">
                                <i class="fas fa-trash mr-1"></i>Eliminar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayAuthorDetail(author) {
        const detailContainer = document.getElementById('author-detail');
        detailContainer.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md border border-blue-200">
                <h3 class="text-xl font-semibold text-blue-600 mb-4">Detalle del Autor</h3>
                <div class="space-y-3">
                    <div>
                        <label class="font-semibold text-gray-700">Nombre:</label>
                        <p class="text-gray-800 text-lg">${author.name}</p>
                    </div>
                    <div>
                        <label class="font-semibold text-gray-700">ID:</label>
                        <p class="text-gray-600">${author.id}</p>
                    </div>
                </div>
            </div>
        `;
        detailContainer.classList.remove('hidden');
    }

    showEditAuthorModal(authorId, currentName) {
        // Podrías implementar un modal para edición rápida
        const newName = prompt('Editar nombre del autor:', currentName);
        if (newName && newName !== currentName) {
            this.authorService.updateAuthor(authorId, { name: newName })
                .then(result => {
                    if (result.success) {
                        this.showMessage('Autor actualizado correctamente', 'success');
                        this.loadAllAuthors();
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
                // ✅ Guardar el texto original si no existe
                if (!button.getAttribute('data-original-text')) {
                    button.setAttribute('data-original-text', button.textContent);
                }
                button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> ${loadingText}`;
            } else {
                button.disabled = false;
                // ✅ Usar el texto original guardado o un texto por defecto
                const originalText = button.getAttribute('data-original-text') || this.getDefaultButtonText(buttonId);
                button.innerHTML = originalText;
            }
        }
    }

    // ✅ Método auxiliar para textos por defecto
    getDefaultButtonText(buttonId) {
        const texts = {
            'create-author-btn': '<i class="fas fa-plus mr-2"></i>Crear Autor',
            'search-author-btn': '<i class="fas fa-search mr-2"></i>Buscar Autor',
            'update-author-btn': '<i class="fas fa-save mr-2"></i>Actualizar Autor'
        };
        return texts[buttonId] || 'Botón';
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

        const authorsSection = document.getElementById('authors-section');
        if (authorsSection) {
            authorsSection.insertBefore(messageDiv, authorsSection.firstChild);
        }

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}