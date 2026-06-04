class App {

    constructor() {
        this.init();
    }

    init() {

        document.addEventListener("DOMContentLoaded", () => {

            this.bindEvents();

            if (typeof authManager !== "undefined") {
                authManager.checkAuth();
            }

        });
    }

    bindEvents() {

        const loginBtn =
            document.getElementById("loginBtn");

        const logoutBtn =
            document.getElementById("logoutBtn");

        const saleBtn =
            document.getElementById("addSaleBtn");

        const addSubscriptionBtn =
            document.getElementById("addSubscriptionBtn");

        const closeModal =
            document.querySelector(".close");

        const saleForm =
            document.getElementById("saleForm");

        loginBtn?.addEventListener("click", () => {

            const password =
                document.getElementById("passwordInput").value;

            authManager.login(password);

        });

        logoutBtn?.addEventListener("click", () => {

            authManager.logout();

        });

        document.querySelectorAll(".nav-btn")
            .forEach(btn => {

                btn.addEventListener("click", (e) => {
                    this.switchTab(e);
                });

            });

        saleBtn?.addEventListener("click", () => {

            document
                .getElementById("saleModal")
                .classList.remove("hidden");

        });

        closeModal?.addEventListener("click", () => {

            document
                .getElementById("saleModal")
                .classList.add("hidden");

        });

        saleForm?.addEventListener("submit", async (e) => {

            e.preventDefault();

            const saleData = {

                date:
                    document.getElementById("saleDate").value,

                amount:
                    Number(
                        document.getElementById("saleAmount").value
                    ),

                status:
                    document.getElementById("saleStatus").value,

                nightShift:
                    document.getElementById("nightShift").checked,

                dialogLink:
                    document.getElementById("dialogLink").value

            };

            await salesManager.addSale(saleData);

            document
                .getElementById("saleModal")
                .classList.add("hidden");

            saleForm.reset();

        });

        addSubscriptionBtn?.addEventListener("click", async () => {

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

        setInterval(() => {

            try {

                dashboardManager?.updateStats();
                salesManager?.loadSales();
                subscriptionsManager?.loadSubscriptions();
                salaryManager?.loadSalaryHistory();

            } catch (error) {

                console.error(
                    "Auto refresh error:",
                    error
                );
            }

        }, 30000);
    }

    switchTab(e) {

        const tabName =
            e.target.dataset.tab;

        document
            .querySelectorAll(".tab-content")
            .forEach(tab => {
                tab.classList.remove("active");
            });

        document
            .querySelectorAll(".nav-btn")
            .forEach(btn => {
                btn.classList.remove("active");
            });

        document
            .getElementById(tabName)
            ?.classList.add("active");

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
