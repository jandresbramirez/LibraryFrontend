// Utilidades de verificación de autenticación
class AuthCheck {
    static redirectIfNotAuthenticated(redirectTo = 'auth.html') {
        const authService = new AuthService();
        if (!authService.isAuthenticated()) {
            window.location.href = redirectTo;
        }
    }

    static redirectIfAuthenticated(redirectTo = 'dashboard.html') {
        const authService = new AuthService();
        if (authService.isAuthenticated()) {
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