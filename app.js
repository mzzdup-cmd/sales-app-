class App {

    constructor() {
        document.addEventListener("DOMContentLoaded", () => {
            this.bindEvents();
            authManager.checkAuth();
        });
    }

    bindEvents() {

        document.getElementById("loginBtn")?.addEventListener("click", () => {
            const pass = document.getElementById("passwordInput").value;
            authManager.login(pass);
        });

        document.getElementById("logoutBtn")?.addEventListener("click", () => {
            authManager.logout();
        });

        document.getElementById("addSubscriptionBtn")?.addEventListener("click", async () => {
            await db.collection("subscriptions").add({
                clientNick: "Новый клиент",
                dialogLink: "",
                format: "2/6",
                firstPaymentDate: new Date().toISOString(),
                payments: {},
                status: "Активна"
            });

            subscriptionsManager.loadSubscriptions();
        });

        document.querySelectorAll(".nav-btn").forEach(btn => {
            btn.addEventListener("click", e => this.switchTab(e));
        });
    }

    switchTab(e) {

        const tab = e.target.dataset.tab;

        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
        document.getElementById(tab)?.classList.add("active");

        if (tab === "dashboard") dashboardManager.updateStats();
        if (tab === "sales") salesManager.loadSales();
        if (tab === "subscriptions") subscriptionsManager.loadSubscriptions();
        if (tab === "salary") salaryManager.loadSalaryHistory();
    }
}

window.app = new App();
