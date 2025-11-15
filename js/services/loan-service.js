class LoanService {
    constructor(authService, userService, bookService) {
        this.authService = authService;
        this.userService = userService;
        this.bookService = bookService;
        this.baseURL = window.APP_CONFIG?.API_BASE_URL || 
                      'https://vigilant-spoon-q7qw9r9r7qpwc49r5-5000.app.github.dev';
    }

    async getAllLoans() {
        try {
            // ✅ Requiere autenticación y rol admin o editor
            if (!this.authService.hasRole(['admin', 'editor'])) {
                return { success: false, error: 'No tienes permisos para ver todos los préstamos' };
            }

            const response = await fetch(`${this.baseURL}/loans`, {
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                const loans = await response.json();
                // Enriquecer préstamos con información de usuario y libro
                const enrichedLoans = await this.enrichLoansWithDetails(loans);
                return { success: true, loans: enrichedLoans };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getLoanById(loanId) {
        try {
            // ✅ Requiere autenticación y rol admin o editor
            if (!this.authService.hasRole(['admin', 'editor'])) {
                return { success: false, error: 'No tienes permisos para ver este préstamo' };
            }

            const response = await fetch(`${this.baseURL}/loans/${loanId}`, {
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                const loan = await response.json();
                const enrichedLoan = await this.enrichLoanWithDetails(loan);
                return { success: true, loan: enrichedLoan };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async createLoan(loanData) {
        try {
            // ✅ Requiere autenticación y rol admin o user
            if (!this.authService.hasRole(['admin', 'user'])) {
                return { success: false, error: 'No tienes permisos para crear préstamos' };
            }

            // Si es usuario normal, solo puede crear préstamos para sí mismo
            if (this.authService.isUser()) {
                const currentUserId = this.authService.getUserId();
                if (loanData.user_id != currentUserId) {
                    return { success: false, error: 'Solo puedes crear préstamos para tu propia cuenta' };
                }
            }

            const response = await fetch(`${this.baseURL}/loans`, {
                method: 'POST',
                headers: this.authService.getAuthHeaders(),
                body: JSON.stringify(loanData)
            });

            if (response.status === 201) {
                const loan = await response.json();
                const enrichedLoan = await this.enrichLoanWithDetails(loan);
                return { success: true, loan: enrichedLoan };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async updateLoan(loanId, returnDate) {
        try {
            // ✅ Requiere autenticación y rol admin o editor
            if (!this.authService.hasRole(['admin', 'editor'])) {
                return { success: false, error: 'No tienes permisos para actualizar préstamos' };
            }

            const response = await fetch(`${this.baseURL}/loans/${loanId}`, {
                method: 'PUT',
                headers: this.authService.getAuthHeaders(),
                body: JSON.stringify({ return_date: returnDate })
            });

            if (response.ok) {
                const loan = await response.json();
                const enrichedLoan = await this.enrichLoanWithDetails(loan);
                return { success: true, loan: enrichedLoan };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async deleteLoan(loanId) {
        try {
            // ✅ Requiere autenticación y rol admin o editor
            if (!this.authService.hasRole(['admin', 'editor'])) {
                return { success: false, error: 'No tienes permisos para eliminar préstamos' };
            }

            const response = await fetch(`${this.baseURL}/loans/${loanId}`, {
                method: 'DELETE',
                headers: this.authService.getAuthHeaders()
            });

            if (response.ok) {
                return { success: true, message: 'Préstamo eliminado correctamente' };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getUserLoans(userId = null) {
        try {
            // Si no se especifica userId, usar el usuario actual
            const targetUserId = userId || this.authService.getUserId();
            
            // Obtener todos los préstamos y filtrar por usuario
            const allLoans = await this.getAllLoans();
            if (!allLoans.success) return allLoans;

            const userLoans = allLoans.loans.filter(loan => loan.user_id == targetUserId);
            return { success: true, loans: userLoans };
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getActiveLoans() {
        try {
            const allLoans = await this.getAllLoans();
            if (!allLoans.success) return allLoans;

            const activeLoans = allLoans.loans.filter(loan => !loan.return_date);
            return { success: true, loans: activeLoans };
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async getOverdueLoans() {
        try {
            const allLoans = await this.getAllLoans();
            if (!allLoans.success) return allLoans;

            const today = new Date().toISOString().split('T')[0];
            const overdueLoans = allLoans.loans.filter(loan => {
                if (loan.return_date) return false; // Ya devuelto
                
                // Calcular fecha límite (30 días después del préstamo)
                const loanDate = new Date(loan.loan_date);
                const dueDate = new Date(loanDate);
                dueDate.setDate(loanDate.getDate() + 30);
                
                return dueDate < new Date();
            });

            return { success: true, loans: overdueLoans };
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    // Métodos auxiliares para enriquecer datos
    async enrichLoansWithDetails(loans) {
        try {
            const enrichedLoans = [];
            
            for (const loan of loans) {
                const enrichedLoan = await this.enrichLoanWithDetails(loan);
                enrichedLoans.push(enrichedLoan);
            }
            
            return enrichedLoans;
        } catch (error) {
            return loans;
        }
    }

    async enrichLoanWithDetails(loan) {
        try {
            const enrichedLoan = { ...loan };
            
            // Obtener información del usuario
            if (loan.user_id) {
                const userResult = await this.userService.getUserById(loan.user_id);
                if (userResult.success) {
                    enrichedLoan.user_name = userResult.user.name;
                    enrichedLoan.user_email = userResult.user.email;
                }
            }
            
            // Obtener información del libro
            if (loan.book_id) {
                const bookResult = await this.bookService.getBookById(loan.book_id);
                if (bookResult.success) {
                    enrichedLoan.book_title = bookResult.book.title;
                    enrichedLoan.book_author = bookResult.book.author_name;
                }
            }
            
            // Calcular estado del préstamo
            enrichedLoan.status = this.calculateLoanStatus(loan);
            enrichedLoan.is_overdue = this.isLoanOverdue(loan);
            
            return enrichedLoan;
        } catch (error) {
            return loan;
        }
    }

    calculateLoanStatus(loan) {
        if (loan.return_date) {
            return 'devuelto';
        }
        
        const loanDate = new Date(loan.loan_date);
        const dueDate = new Date(loanDate);
        dueDate.setDate(loanDate.getDate() + 30);
        const today = new Date();
        
        if (today > dueDate) {
            return 'vencido';
        }
        
        return 'activo';
    }

    isLoanOverdue(loan) {
        if (loan.return_date) return false;
        
        const loanDate = new Date(loan.loan_date);
        const dueDate = new Date(loanDate);
        dueDate.setDate(loanDate.getDate() + 30);
        
        return new Date() > dueDate;
    }

    formatDate(dateString) {
        if (!dateString) return 'No devuelto';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    calculateDueDate(loanDate) {
        const date = new Date(loanDate);
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    }
}