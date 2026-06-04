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
            authManager?.checkAuth();
        } catch (e) {
            console.error("Auth init error:", e);
        }

        // Первичная загрузка данных
        this.refreshAll();
    }

    bindEvents() {
        const loginBtn = document.getElementById("loginBtn");
        const logoutBtn = document.getElementById("logoutBtn");
        const saleBtn = document.getElementById("addSaleBtn");
        const closeModal = document.querySelector(".close");
        const saleForm = document.getElementById("saleForm");
        const addSubscriptionBtn = document.getElementById("addSubscriptionBtn");

        // Вход
        loginBtn?.addEventListener("click", () => {
            const password = document.getElementById("passwordInput")?.value || "";
            authManager?.login(password);
        });

        // Выход
        logoutBtn?.addEventListener("click", () => {
            authManager?.logout();
        });

        // Навигация по вкладкам
        document.querySelectorAll(".nav-btn").forEach(btn => {
            btn.addEventListener("click", (e) => this.switchTab(e));
        });

        // Модальное окно продаж
        saleBtn?.addEventListener("click", () => {
            document.getElementById("saleModal")?.classList.remove("hidden");
        });

        closeModal?.addEventListener("click", () => {
            document.getElementById("saleModal")?.classList.add("hidden");
        });

        // Добавление продажи
        saleForm?.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!salesManager) return;

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

        // Добавление подписки вручную
        addSubscriptionBtn?.addEventListener("click", async () => {
            if (!subscriptionsManager) return;
            await db.collection("subscriptions").add({
                clientNick: "Новый клиент",
                dialogLink: "",
                format: "2/6",
                firstPaymentDate: new Date().toISOString(),
                payments: {},
                status: "Активна"
            });
            await subscriptionsManager.loadSubscriptions();
        });

        // Автообновление каждые 30 секунд
        setInterval(() => this.refreshAll(), 30000);
    }

    refreshAll() {
        try {
            dashboardManager?.updateStats();
            salesManager?.loadSales();
            subscriptionsManager?.loadSubscriptions();
            salaryManager?.loadSalaryHistory();
        } catch (e) {
            console.error("Auto refresh error:", e);
        }
    }

    switchTab(e) {
        const tabName = e.target.dataset.tab;

        // Скрыть все вкладки
        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
        const tab = document.getElementById(tabName);
        if (tab) tab.classList.add("active");

        // Обновить активность кнопок
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");

        // Обновление данных конкретной вкладки
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

// Инициализация приложения
window.app = new App();
