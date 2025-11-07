class LoanController {
    constructor(loanService, authService, userService, bookService) {
        this.loanService = loanService;
        this.authService = authService;
        this.userService = userService;
        this.bookService = bookService;
        this.users = [];
        this.books = [];
    }

    init() {
        this.setupLoanEvents();
        this.loadAllLoans();
        this.loadUsersAndBooksForSelects();
    }

    setupLoanEvents() {
        // Botón para crear préstamo
        const createLoanForm = document.getElementById('create-loan-form');
        if (createLoanForm) {
            createLoanForm.addEventListener('submit', (e) => this.handleCreateLoan(e));
        }

        // Botón para buscar préstamo
        const searchLoanForm = document.getElementById('search-loan-form');
        if (searchLoanForm) {
            searchLoanForm.addEventListener('submit', (e) => this.handleSearchLoan(e));
        }

        // Filtros
        const filterActive = document.getElementById('filter-active');
        const filterOverdue = document.getElementById('filter-overdue');
        const filterReturned = document.getElementById('filter-returned');
        const filterAll = document.getElementById('filter-all');

        if (filterActive) filterActive.addEventListener('click', () => this.filterLoans('active'));
        if (filterOverdue) filterOverdue.addEventListener('click', () => this.filterLoans('overdue'));
        if (filterReturned) filterOverdue.addEventListener('click', () => this.filterLoans('returned'));
        if (filterAll) filterAll.addEventListener('click', () => this.filterLoans('all'));

        // Si es usuario normal, cargar sus préstamos
        if (this.authService.isUser()) {
            this.loadUserLoans();
        }
    }

    async loadAllLoans() {
        // Si es usuario normal, no puede ver todos los préstamos
        if (this.authService.isUser()) {
            this.showMessage('Solo puedes ver tus propios préstamos', 'info');
            return;
        }

        const result = await this.loanService.getAllLoans();

        if (result.success) {
            this.loans = result.loans;
            this.displayLoans(this.loans);
            this.updateLoansCount(this.loans.length);
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    async loadUserLoans() {
        const result = await this.loanService.getUserLoans();

        if (result.success) {
            this.loans = result.loans;
            this.displayLoans(this.loans);
            this.updateLoansCount(this.loans.length, 'tus préstamos');
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    async loadUsersAndBooksForSelects() {
        // Cargar usuarios (solo para admin/editor)
        if (this.authService.hasRole(['admin', 'editor'])) {
            const usersResult = await this.userService.getAllUsers();
            if (usersResult.success) {
                this.users = usersResult.users;
                this.populateUserSelect();
            }
        } else {
            // Para usuarios normales, cargar solo su información
            const userResult = await this.userService.getCurrentUserProfile();
            if (userResult.success) {
                this.users = [userResult.user];
                this.populateUserSelect();
            }
        }

        // Cargar libros disponibles
        const booksResult = await this.bookService.getAllBooks();
        if (booksResult.success) {
            this.books = booksResult.books;
            this.populateBookSelect();
        }
    }

    populateUserSelect() {
        const userSelect = document.getElementById('loan-user-id');
        if (userSelect) {
            if (this.authService.isUser()) {
                // Usuario normal - solo puede seleccionarse a sí mismo
                userSelect.innerHTML = this.users.map(user => 
                    `<option value="${user.id}" selected>${user.name} (Tú)</option>`
                ).join('');
                userSelect.disabled = true;
            } else {
                // Admin/editor - puede seleccionar cualquier usuario
                userSelect.innerHTML = `
                    <option value="">Selecciona un usuario</option>
                    ${this.users.map(user => 
                        `<option value="${user.id}">${user.name} (${user.email})</option>`
                    ).join('')}
                `;
            }
        }
    }

    populateBookSelect() {
        const bookSelect = document.getElementById('loan-book-id');
        if (bookSelect) {
            bookSelect.innerHTML = `
                <option value="">Selecciona un libro</option>
                ${this.books.map(book => 
                    `<option value="${book.id}">${book.title} - ${book.author_name}</option>`
                ).join('')}
            `;
        }
    }

    async handleCreateLoan(event) {
        event.preventDefault();
        
        const userId = document.getElementById('loan-user-id').value;
        const bookId = document.getElementById('loan-book-id').value;

        if (!userId || !bookId) {
            this.showMessage('Usuario y libro son obligatorios', 'error');
            return;
        }

        this.setLoading('create-loan-btn', true, 'Creando préstamo...');

        const result = await this.loanService.createLoan({ 
            user_id: parseInt(userId), 
            book_id: parseInt(bookId) 
        });

        if (result.success) {
            this.showMessage(`Préstamo creado exitosamente para "${result.loan.user_name}"`, 'success');
            document.getElementById('create-loan-form').reset();
            this.loadAllLoans(); // Recargar la lista
        } else {
            this.showMessage(result.error, 'error');
        }

        this.setLoading('create-loan-btn', false, 'Crear Préstamo');
    }

    async handleSearchLoan(event) {
        event.preventDefault();
        
        const loanId = document.getElementById('search-loan-id').value;

        if (!loanId) {
            this.showMessage('Por favor ingresa un ID de préstamo', 'error');
            return;
        }

        this.setLoading('search-loan-btn', true, 'Buscando...');

        const result = await this.loanService.getLoanById(parseInt(loanId));

        if (result.success) {
            this.displayLoanDetail(result.loan);
        } else {
            this.showMessage(result.error, 'error');
            document.getElementById('loan-detail').classList.add('hidden');
        }

        this.setLoading('search-loan-btn', false, 'Buscar Préstamo');
    }

    async returnLoan(loanId, userName, bookTitle) {
        const returnDate = new Date().toISOString().split('T')[0];
        
        if (!confirm(`¿Marcar como devuelto el préstamo de "${bookTitle}" para ${userName}?`)) {
            return;
        }

        const result = await this.loanService.updateLoan(loanId, returnDate);

        if (result.success) {
            this.showMessage('Libro marcado como devuelto correctamente', 'success');
            this.loadAllLoans(); // Recargar la lista
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    async deleteLoan(loanId, userName, bookTitle) {
        if (!confirm(`¿Estás seguro de que quieres eliminar el préstamo de "${bookTitle}" para ${userName}?`)) {
            return;
        }

        const result = await this.loanService.deleteLoan(loanId);

        if (result.success) {
            this.showMessage(result.message, 'success');
            this.loadAllLoans(); // Recargar la lista
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    filterLoans(filterType) {
        let filteredLoans = [];

        switch (filterType) {
            case 'active':
                filteredLoans = this.loans.filter(loan => loan.status === 'activo');
                break;
            case 'overdue':
                filteredLoans = this.loans.filter(loan => loan.status === 'vencido');
                break;
            case 'returned':
                filteredLoans = this.loans.filter(loan => loan.status === 'devuelto');
                break;
            case 'all':
            default:
                filteredLoans = this.loans;
                break;
        }

        this.displayLoans(filteredLoans);
        this.updateLoansCount(filteredLoans.length, ` ${filterType === 'all' ? '' : `(${filterType})`}`);
    }

    displayLoans(loans) {
        const container = document.getElementById('loans-container');
        
        if (!loans || loans.length === 0) {
            container.innerHTML = `
                <div class="col-span-2 text-center py-12 text-gray-500">
                    <i class="fas fa-exchange-alt text-4xl mb-4 opacity-50"></i>
                    <p class="text-lg">No se encontraron préstamos</p>
                    <p class="text-sm mt-2">No hay préstamos que coincidan con los criterios actuales</p>
                </div>
            `;
            return;
        }

        container.innerHTML = loans.map(loan => `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 loan-card hover:shadow-md transition-shadow duration-200 ${loan.is_overdue ? 'border-l-4 border-l-red-500' : ''}">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg text-gray-800 mb-2">${loan.book_title || 'Libro no encontrado'}</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div class="flex items-center text-gray-600 mb-1">
                                    <i class="fas fa-user mr-2 text-blue-500"></i>
                                    <span><strong>Usuario:</strong> ${loan.user_name || 'No especificado'}</span>
                                </div>
                                <div class="flex items-center text-gray-600 mb-1">
                                    <i class="fas fa-book mr-2 text-green-500"></i>
                                    <span><strong>Autor:</strong> ${loan.book_author || 'No especificado'}</span>
                                </div>
                            </div>
                            <div>
                                <div class="flex items-center text-gray-600 mb-1">
                                    <i class="fas fa-calendar-alt mr-2 text-purple-500"></i>
                                    <span><strong>Préstamo:</strong> ${this.formatDisplayDate(loan.loan_date)}</span>
                                </div>
                                <div class="flex items-center text-gray-600 mb-1">
                                    <i class="fas fa-undo-alt mr-2 ${loan.return_date ? 'text-green-500' : 'text-gray-400'}"></i>
                                    <span><strong>Devolución:</strong> ${loan.return_date ? this.formatDisplayDate(loan.return_date) : 'Pendiente'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col space-y-2 ml-4">
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${this.getStatusBadgeClass(loan.status)}">
                            ${this.getStatusText(loan.status)}
                        </span>
                        
                        ${this.authService.hasRole(['admin', 'editor']) ? `
                            ${!loan.return_date ? `
                                <button onclick="loanController.returnLoan(${loan.id}, '${loan.user_name}', '${loan.book_title}')" 
                                        class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition duration-200 flex items-center">
                                    <i class="fas fa-check mr-1"></i>Devolver
                                </button>
                            ` : ''}
                            
                            <button onclick="loanController.deleteLoan(${loan.id}, '${loan.user_name}', '${loan.book_title}')" 
                                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition duration-200 flex items-center">
                                <i class="fas fa-trash mr-1"></i>Eliminar
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        <i class="fas fa-hashtag mr-1"></i>ID: ${loan.id}
                    </span>
                    <span class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        <i class="fas fa-user mr-1"></i>User ID: ${loan.user_id}
                    </span>
                    <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        <i class="fas fa-book mr-1"></i>Book ID: ${loan.book_id}
                    </span>
                    ${loan.is_overdue ? `
                        <span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            <i class="fas fa-exclamation-triangle mr-1"></i>Vencido
                        </span>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    displayLoanDetail(loan) {
        const detailContainer = document.getElementById('loan-detail');
        const dueDate = this.loanService.calculateDueDate(loan.loan_date);
        
        detailContainer.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-md border border-blue-200">
                <h3 class="text-xl font-semibold text-blue-600 mb-4 flex items-center">
                    <i class="fas fa-info-circle mr-2"></i>Detalle del Préstamo
                </h3>
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="font-semibold text-gray-700 block mb-1">Libro:</label>
                            <p class="text-gray-800 text-lg">${loan.book_title || 'No especificado'}</p>
                            <p class="text-gray-600 text-sm">por ${loan.book_author || 'Autor desconocido'}</p>
                        </div>
                        <div>
                            <label class="font-semibold text-gray-700 block mb-1">Usuario:</label>
                            <p class="text-gray-800">${loan.user_name || 'No especificado'}</p>
                            <p class="text-gray-600 text-sm">${loan.user_email || ''}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="font-semibold text-gray-700 block mb-1">Fecha Préstamo:</label>
                            <p class="text-gray-600">${this.formatDisplayDate(loan.loan_date)}</p>
                        </div>
                        <div>
                            <label class="font-semibold text-gray-700 block mb-1">Fecha Devolución:</label>
                            <p class="text-gray-600 ${loan.return_date ? 'text-green-600' : 'text-orange-600'}">
                                ${loan.return_date ? this.formatDisplayDate(loan.return_date) : 'Pendiente'}
                            </p>
                        </div>
                        <div>
                            <label class="font-semibold text-gray-700 block mb-1">Fecha Límite:</label>
                            <p class="text-gray-600">${this.formatDisplayDate(dueDate)}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 rounded-lg ${this.getStatusBackgroundClass(loan.status)}">
                        <span class="font-semibold ${this.getStatusTextColor(loan.status)}">
                            Estado: ${this.getStatusText(loan.status).toUpperCase()}
                        </span>
                        ${loan.is_overdue ? `
                            <span class="bg-red-500 text-white px-2 py-1 rounded text-sm">
                                <i class="fas fa-exclamation-triangle mr-1"></i>VENCIDO
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        detailContainer.classList.remove('hidden');
    }

    getStatusBadgeClass(status) {
        const classes = {
            'activo': 'bg-green-100 text-green-800 border border-green-200',
            'vencido': 'bg-red-100 text-red-800 border border-red-200',
            'devuelto': 'bg-gray-100 text-gray-800 border border-gray-200'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getStatusBackgroundClass(status) {
        const classes = {
            'activo': 'bg-green-50 border border-green-200',
            'vencido': 'bg-red-50 border border-red-200',
            'devuelto': 'bg-gray-50 border border-gray-200'
        };
        return classes[status] || 'bg-gray-50';
    }

    getStatusTextColor(status) {
        const classes = {
            'activo': 'text-green-700',
            'vencido': 'text-red-700',
            'devuelto': 'text-gray-700'
        };
        return classes[status] || 'text-gray-700';
    }

    getStatusText(status) {
        const texts = {
            'activo': 'Activo',
            'vencido': 'Vencido',
            'devuelto': 'Devuelto'
        };
        return texts[status] || status;
    }

    formatDisplayDate(dateString) {
        if (!dateString) return 'No especificada';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    updateLoansCount(count, suffix = '') {
        const countElement = document.getElementById('loans-count');
        if (countElement) {
            countElement.textContent = `${count} préstamos${suffix}`;
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
            : type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800';

        const messageDiv = document.createElement('div');
        messageDiv.className = `${alertClass} border rounded-lg p-4 mb-4 shadow-lg`;
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

        const loansSection = document.getElementById('loans-section');
        if (loansSection) {
            loansSection.insertBefore(messageDiv, loansSection.firstChild);
        }

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}