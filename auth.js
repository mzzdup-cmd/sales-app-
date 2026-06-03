class AuthManager {
    constructor() {
        this.password = '1234';
    }

    login(inputPassword) {
        if (inputPassword === this.password) {
            localStorage.setItem('isAuthenticated', 'true');
            this.showMainApp();
            return true;
        } else {
            alert('Неверный пароль');
            return false;
        }
    }

    logout() {
        localStorage.removeItem('isAuthenticated');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }

    checkAuth() {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        if (isAuthenticated) {
            this.showMainApp();
        }
    }

    showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
    }
}

const authManager = new AuthManager();
