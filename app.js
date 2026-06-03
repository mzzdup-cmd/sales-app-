class App {

    constructor() {
        this.init();
    }

    init() {
        document.addEventListener("DOMContentLoaded", () => {
            this.bindEvents();
            this.safeInitAuth();
        });
    }

    safeInitAuth() {
        try {
            if (typeof authManager !== "undefined") {
                authManager.checkAuth();
            }
        } catch (e) {
            console.error("Auth init error:", e);
        }
    }

    bindEvents() {

        const loginBtn = document.getElementById("loginBtn");
        const logoutBtn = document.getElementById("logoutBtn");
        const saleBtn = document.getElementById("addSaleBtn");
        const closeModal = document.querySelector(".close");
        const saleForm = document.getElementById("saleForm");

        // LOGIN
        if (loginBtn) {
            loginBtn.addEventListener("click", () => {
                const password = document.getElementById("passwordInput")?.value || "";
                if (typeof authManager !== "undefined") {
                    authManager.login(password);
                }
            });
        }

        // LOGOUT
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                if (typeof authManager !== "undefined") {
                    authManager.logout();
                }
            });
        }

        // NAVIGATION
        document.querySelectorAll(".nav-btn").forEach(btn => {
            btn.addEventListener("click", (e) => this.switchTab(e));
        });

        // OPEN MODAL
        if (saleBtn) {
            saleBtn.addEventListener("click", () => {
                document.getElementById("saleModal")?.classList.remove("hidden");
            });
        }

        // CLOSE MODAL
        if (closeModal) {
            closeModal.addEventListener("click", () => {
                document.getElementById("saleModal")?.classList.add("hidden");
            });
        }

        // SALE FORM
        if (saleForm) {
            saleForm.addEventListener("submit", async (e) => {
                e.preventDefault();

                const saleData = {
                    date: document.getElementById("saleDate")?.value || "",
                    amount: Number(document.getElementById("saleAmount")?.value || 0),
                    status: document.getElementById("saleStatus")?.value || "Полная",
                    nightShift: document.getElementById("nightShift")?.checked || false,
                    dialogLink: document.getElementById("dialogLink")?.value || ""
                };

                try {
                    if (typeof salesManager !== "undefined") {
                        await salesManager.addSale(saleData);
                    }

                    document.getElementById("saleModal")?.classList.add("hidden");
                    saleForm.reset();

                } catch (err) {
                    console.error("Sale submit error:", err);
                }
            });
        }

        // OPTIONAL: ADD SUBSCRIPTION BUTTON (если появится)
        document.getElementById("addSubscriptionBtn")?.addEventListener("click", async () => {
            try {
                await db.collection("subscriptions").add({
                    clientNick: "Новый клиент",
                    dialogLink: "",
                    format: "2/6",
                    firstPaymentDate: new Date().toISOString(),
                    payments: {},
                    status: "Активна"
                });

                if (typeof subscriptionsManager !== "undefined") {
                    subscriptionsManager.loadSubscriptions();
                }

            } catch (e) {
                console.error("Add subscription error:", e);
            }
        });

        // AUTO REFRESH
        setInterval(() => {

            try {
                dashboardManager?.updateStats();
                salesManager?.loadSales();
                subscriptionsManager?.loadSubscriptions();
                salaryManager?.loadSalaryHistory();
            } catch (e) {
                console.error("Auto refresh error:", e);
            }

        }, 30000);
    }

    switchTab(e) {

        const tabName = e.target.dataset.tab;
        if (!tabName) return;

        document.querySelectorAll(".tab-content")
            .forEach(t => t.classList.remove("active"));

        document.getElementById(tabName)?.classList.add("active");

        document.querySelectorAll(".nav-btn")
            .forEach(b => b.classList.remove("active"));

        e.target.classList.add("active");

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
