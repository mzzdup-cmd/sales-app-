class AuthManager {

    constructor() {
        this.password = "1234";
    }

    login(inputPassword) {

        if (inputPassword !== this.password) {
            alert("Неверный пароль");
            return;
        }

        localStorage.setItem("auth", "true");

        this.showMainApp();

        setTimeout(() => {

            if (window.dashboardManager) {
                dashboardManager.updateStats();
            }

            if (window.salesManager) {
                salesManager.loadSales();
            }

        }, 300);
    }

    logout() {

        localStorage.removeItem("auth");

        document.getElementById("mainApp")
            .classList.add("hidden");

        document.getElementById("loginScreen")
            .classList.remove("hidden");
    }

    checkAuth() {

        const ok =
            localStorage.getItem("auth") === "true";

        if (ok) {
            this.showMainApp();
        }
    }

    showMainApp() {

        document.getElementById("loginScreen")
            .classList.add("hidden");

        document.getElementById("mainApp")
            .classList.remove("hidden");
    }
}

const authManager =
    new AuthManager();
