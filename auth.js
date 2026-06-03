class AuthManager {

    constructor() {
        this.password = "1234";
    }

    login(password) {

        if (password === this.password) {

            localStorage.setItem("isAuthenticated", "true");

            this.showMainApp();

            return true;
        }

        alert("Неверный пароль");

        return false;
    }

    logout() {

        localStorage.removeItem("isAuthenticated");

        document
            .getElementById("loginScreen")
            .classList.remove("hidden");

        document
            .getElementById("mainApp")
            .classList.add("hidden");
    }

    checkAuth() {

        const auth =
            localStorage.getItem("isAuthenticated");

        if (auth === "true") {
            this.showMainApp();
        }
    }

    showMainApp() {

        document
            .getElementById("loginScreen")
            .classList.add("hidden");

        document
            .getElementById("mainApp")
            .classList.remove("hidden");
    }
}

const authManager = new AuthManager();
