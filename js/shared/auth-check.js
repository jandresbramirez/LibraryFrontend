// js/shared/auth-check.js
class AuthCheck {
    // ✅ AGREGAR ESTE MÉTODO FALTANTE
    static isAuthenticated() {
        const authService = new AuthService();
        return authService.isAuthenticated();
    }

    static redirectIfNotAuthenticated(redirectTo = 'auth.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectTo;
        }
    }

    static redirectIfAuthenticated(redirectTo = 'dashboard.html') {
        if (this.isAuthenticated()) {
            window.location.href = redirectTo;
        }
    }

    static setupProtectedPage() {
        this.redirectIfNotAuthenticated();
    }

    static setupPublicPage() {
        this.redirectIfAuthenticated();
    }
}

// ✅ Asegurar que esté disponible globalmente
window.AuthCheck = AuthCheck;