class App {
    constructor() {
        this.initEventListeners();
        authManager.checkAuth();
    }

    initEventListeners() {
        // Аутентификация
        document.getElementById('loginBtn').addEventListener('click', () => {
            const password = document.getElementById('passwordInput').value;
            authManager.login(password);
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            authManager.logout();
        });

        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Продажи
        document.getElementById('addSaleBtn').addEventListener('click', () => {
            document.getElementById('saleModal').classList.remove('hidden');
        });

        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('saleModal').classList.add('hidden');
        });

        document.getElementById('saleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const saleData = {
                date: document.getElementById('saleDate').value,
                amount: parseFloat(document.getElementById('saleAmount').value),
                status: document.getElementById('saleStatus').value,
                nightShift: document.getElementById('nightShift').checked,
                dialogLink: document.getElementById('dialogLink').value
            };

            await salesManager.addSale(saleData);
            document.getElementById('saleModal').classList.add('hidden');
            document.getElementById('saleForm').reset();
        });

        // Автообновление данных каждые 30 секунд
        setInterval(() => {
            dashboardManager.updateStats();
            salesManager.loadSales();
            subscriptionsManager.loadSubscriptions();
            salaryManager.loadSalaryHistory();
        }, 30000);
    }

    switchTab(tabName) {
        // Скрыть все вкладки
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Показать выбранную вкладку
        document.getElementById(tabName).classList.add('active');

        // Обновить активную кнопку навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Загрузить данные для вкладки
        switch (tabName) {
            case 'dashboard':
                dashboardManager.updateStats();
                break;
            case 'sales':
                salesManager.loadSales();
                break;
            case 'subscriptions':
                subscriptionsManager.loadSubscriptions();
                break;
            case 'salary':
                salaryManager.loadSalaryHistory();
                break;
        }
    }
}

// Инициализация приложения
const app = new App();
