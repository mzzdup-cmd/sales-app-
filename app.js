class App {

    constructor() {
        this.init();
    }

    init() {

        document.addEventListener(
            "DOMContentLoaded",
            () => {
                this.bindEvents();
                authManager.checkAuth();
            }
        );
    }

    bindEvents() {

        const loginBtn =
            document.getElementById("loginBtn");

        const logoutBtn =
            document.getElementById("logoutBtn");

        const saleBtn =
            document.getElementById("addSaleBtn");

        const closeModal =
            document.querySelector(".close");

        const saleForm =
            document.getElementById("saleForm");

        loginBtn?.addEventListener(
            "click",
            () => {

                const password =
                    document.getElementById(
                        "passwordInput"
                    ).value;

                authManager.login(password);
            }
        );

        logoutBtn?.addEventListener(
            "click",
            () => authManager.logout()
        );

        document.querySelectorAll(".nav-btn")
            .forEach(btn => {

                btn.addEventListener(
                    "click",
                    (e) => this.switchTab(e)
                );

            });

        saleBtn?.addEventListener(
            "click",
            () => {
                document.getElementById(
                    "saleModal"
                ).classList.remove("hidden");
            }
        );

        closeModal?.addEventListener(
            "click",
            () => {
                document.getElementById(
                    "saleModal"
                ).classList.add("hidden");
            }
        );

        saleForm?.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();

                const saleData = {

                    date:
                        document.getElementById(
                            "saleDate"
                        ).value,

                    amount:
                        Number(
                            document.getElementById(
                                "saleAmount"
                            ).value
                        ),

                    status:
                        document.getElementById(
                            "saleStatus"
                        ).value,

                    nightShift:
                        document.getElementById(
                            "nightShift"
                        ).checked,

                    dialogLink:
                        document.getElementById(
                            "dialogLink"
                        ).value
                };

                await salesManager.addSale(saleData);

                document.getElementById(
                    "saleModal"
                ).classList.add("hidden");

                saleForm.reset();
            }
        );

        setInterval(() => {

            if (dashboardManager) {
                dashboardManager.updateStats();
            }

            if (salesManager) {
                salesManager.loadSales();
            }

            if (subscriptionsManager) {
                subscriptionsManager.loadSubscriptions();
            }

            if (salaryManager) {
                salaryManager.loadSalaryHistory();
            }

        }, 30000);
    }

    switchTab(e) {

        const tabName =
            e.target.dataset.tab;

        document.querySelectorAll(".tab-content")
            .forEach(t =>
                t.classList.remove("active")
            );

        const tab =
            document.getElementById(tabName);

        if (tab) {
            tab.classList.add("active");
        }

        document.querySelectorAll(".nav-btn")
            .forEach(b =>
                b.classList.remove("active")
            );

        e.target.classList.add("active");

        switch (tabName) {

            case "dashboard":
                dashboardManager.updateStats();
              break;

            case "sales":
                salesManager.loadSales();
                break;

            case "subscriptions":
                subscriptionsManager.loadSubscriptions();
                break;

            case "salary":
                salaryManager.loadSalaryHistory();
                break;
        }
    }
}

window.app = new App();  
