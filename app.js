class App {

    constructor() {
        this.init();
    }

    init() {
        document.addEventListener("DOMContentLoaded", () => {
            this.bindEvents();
            this.safeInit();
        });
    }

    safeInit() {
        try {
            if (typeof authManager !== "undefined") {
                authManager.checkAuth();
            }
        } catch (e) {
            console.error("Auth init error:", e);
        }

        // первичная загрузка (если есть менеджеры)
        this.refreshAll();
    }

    bindEvents() {

        const loginBtn = document.getElementById("loginBtn");
        const logoutBtn = document.getElementById("logoutBtn");
        const saleBtn = document.getElementById("addSaleBtn");
        const closeModal = document.querySelector(".close");
        const saleForm = document.getElementById("saleForm");

        loginBtn?.addEventListener("click", () => {
            const password = document.getElementById("passwordInput")?.value || "";

            if (typeof authManager !== "undefined") {
                authManager.login(password);
            }
        });

        logoutBtn?.addEventListener("click", () => {
            if (typeof authManager !== "undefined") {
                authManager.logout();
            }
        });

        document.querySelectorAll(".nav-btn").forEach(btn => {
            btn.addEventListener("click", (e) => this.switchTab(e));
        });

        saleBtn?.addEventListener("click", () => {
            document.getElementById("saleModal")?.classList.remove("hidden");
        });

        closeModal?.addEventListener("click", () => {
            document.getElementById("saleModal")?.classList.add("hidden");
        });

        saleForm?.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (typeof salesManager === "undefined") return;

            const saleData = {
                date: document.getElementById("saleDate")?.value,
                amount: Number(document.getElementById("saleAmount")?.value || 0),
                status: document.getElementById("saleStatus")?.value,
                nightShift: document.getElementById("nightShift")?.checked,
                dialogLink: document.getElementById("dialogLink")?.value
            };

            await salesManager.addSale(saleData);

            document.getElementById("saleModal")?.classList.add("hidden");
            saleForm.reset();
        });

        // автообновление
        setInterval(() => {
            this.refreshAll();
        }, 30000);
    }

    refreshAll() {
        try {
            if (typeof dashboardManager !== "undefined") {
                dashboardManager.updateStats();
            }

            if (typeof salesManager !== "undefined") {
                salesManager.loadSales();
            }

            if (typeof subscriptionsManager !== "undefined") {
                subscriptionsManager.loadSubscriptions();
            }

            if (typeof salaryManager !== "undefined") {
                salaryManager.loadSalaryHistory();
            }

        } catch (e) {
            console.error("Auto refresh error:", e);
        }
    }

    switchTab(e) {
        const tabName = e.target.dataset.tab;

        document.querySelectorAll(".tab-content")
            .forEach(t => t.classList.remove("active"));

        const tab = document.getElementById(tabName);
        if (tab) tab.classList.add("active");

        document.querySelectorAll(".nav-btn")
            .forEach(b => b.classList.remove("active"));

        e.target.classList.add("active");

        // обновление конкретной вкладки
        switch (tabName) {
            case "dashboard":
                dashboardManager?.updateStats();
                break;

            case "sales":
                salesManager?.loadSales();
                break;

            case "subscriptions":
                subscriptionsManager?.loadSubscriptions();
                break;

            case "salary":
                salaryManager?.loadSalaryHistory();
                break;
                }
    }
}

window.app = new App();
