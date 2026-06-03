class App {

    constructor() {

        this.initEvents();

        authManager.checkAuth();
    }

    initEvents() {

        // Вход

        document
            .getElementById("loginBtn")
            .addEventListener("click", () => {

                const password =
                    document.getElementById(
                        "passwordInput"
                    ).value;

                authManager.login(password);

            });

        // Enter

        document
            .getElementById("passwordInput")
            .addEventListener("keypress", e => {

                if (e.key === "Enter") {

                    document
                        .getElementById("loginBtn")
                        .click();
                }

            });

        // Выход

        document
            .getElementById("logoutBtn")
            .addEventListener("click", () => {

                authManager.logout();

            });

        // Навигация

        document
            .querySelectorAll(".nav-btn")
            .forEach(btn => {

                btn.addEventListener("click", () => {

                    this.switchTab(
                        btn.dataset.tab,
                        btn
                    );

                });

            });

        // Продажа

        document
            .getElementById("addSaleBtn")
            .addEventListener("click", () => {

                document
                    .getElementById("saleModal")
                    .classList.remove("hidden");

            });

        // Закрытие модалки

        document
            .querySelector(".close")
            .addEventListener("click", () => {

                document
                    .getElementById("saleModal")
                    .classList.add("hidden");

            });

        // Сохранение продажи

        document
            .getElementById("saleForm")
            .addEventListener("submit", async e => {

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

                document
                    .getElementById("saleForm")
                    .reset();

            });

    }

    switchTab(tabName, button) {

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
            .classList.add("active");

        button.classList.add("active");

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

const salesTrackerApp = new App();
