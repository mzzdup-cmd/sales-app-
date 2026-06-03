class DashboardManager {
    constructor() {
        this.planAmount = 800000; // План продаж в рублях
        this.baseSalary = 50000; // Оклад
        this.commissionRate = 0.05; // Процент с продаж
        this.nightShiftBonus = 2000; // Бонус за ночную смену
        this.bonusThresholds = [
            { threshold: 700000, bonus: 5000 },
            { threshold: 800000, bonus: 10000 }
        ];
    }

    async updateStats() {
        const sales = await this.getSalesForCurrentMonth();
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
        const nightShifts = sales.filter(sale => sale.nightShift).length;

        // Расчёт выполнения плана
        const planProgress = Math.min((totalRevenue / this.planAmount) * 100, 100);
        const remainingToPlan = Math.max(this.planAmount - totalRevenue, 0);

        // Расчёт зарплаты
        const commission = totalRevenue * this.commissionRate;
        const bonus = this.calculateBonuses(totalRevenue, nightShifts);
        const currentSalary = this.baseSalary + commission + bonus;

        // Обновление интерфейса
        document.getElementById('totalRevenue').textContent = this.formatCurrency(totalRevenue);
        document.getElementById('planProgress').textContent = `${planProgress.toFixed(1)}%`;
        document.getElementById('remainingToPlan').textContent = this.formatCurrency(remainingToPlan);
        document.getElementById('salaryForecast').textContent = this.formatCurrency(currentSalary);
        document.getElementById('currentSalary').textContent = this.formatCurrency(currentSalary);

        // Прогноз зарплаты при выполнении плана
        const fullPlanSalary = this.baseSalary + (this.planAmount * this.commissionRate) + this.calculateBonuses(this.planAmount, nightShifts);
        document.getElementById('fullPlanSalary').textContent = this.formatCurrency(fullPlanSalary);

        // До следующего бонуса
        const nextBonus = this.bonusThresholds.find(b => totalRevenue < b.threshold);
        if (nextBonus) {
            const remainingForBonus = nextBonus.threshold - totalRevenue;
            document.getElementById('bonusProgress').textContent = this.formatCurrency(remainingForBonus);
        } else {
            document.getElementById('bonusProgress').textContent = 'Все бонусы получены';
        }

        this.updateCharts(sales, planProgress);
        this.updateSalaryForecast(totalRevenue, sales);
    }

    calculateBonuses(revenue, nightShifts) {
        let bonus = nightShifts * this.nightShiftBonus;

        for (const threshold of this.bonusThresholds) {
            if (revenue >= threshold.threshold) {
                bonus += threshold.bonus;
            }
        }

        return bonus;
    }

    async getSalesForCurrentMonth() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const snapshot = await db.collection('sales')
            .where('date', '>=', startOfMonth)
            .get();

        return snapshot.docs.map(doc => doc.data());
    }

    updateCharts(sales, planProgress) {
        // Круговой график выполнения плана
        const planChart = new Chart(document.getElementById('planChart'), {
            type: 'doughnut',
            data: {
                labels: ['Выполнено', 'Осталось'],
                datasets: [{
                    data: [planProgress, 100 - planProgress],
                    backgroundColor: ['#4a6cf7', '#e2e8f0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // Линейный график продаж по дням
        const dailySales = this.groupSalesByDay(sales);
        const dates = Object.keys(dailySales);
        const amounts = Object.values(dailySales);

        new Chart(document.getElementById('salesChart'), {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Продажи по дням',
                    data: amounts,
                    borderColor: '#4a6cf7',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    groupSalesByDay(sales) {
        const grouped = {};
        sales.forEach(sale => {
            const date = new Date(sale.date).toLocaleDateString();
            if (!grouped[date]) grouped[date] = 0;
            grouped[date] += sale.amount;
        });
        return grouped;
    }

    updateSalaryForecast(totalRevenue, sales) {
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysPassed = today.getDate();

        // Продажи сегодня
        const todaySales = sales
            .filter(s => new Date(s.date).toDateString() === today.toDateString())
            .reduce((sum, s) => sum + s.amount, 0);

        // Продажи за неделю
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        const weeklySales = sales
            .filter(s => new Date(s.date) >= weekAgo)
            .reduce((sum, s) => sum + s.amount, 0);

        // Средняя выручка в день
        const avgDailyRevenue = daysPassed > 0 ? totalRevenue / daysPassed : 0;

        // Прогноз выполнения плана
        let forecastText = '';
        if (avgDailyRevenue > 0) {
            const daysNeeded = remainingToPlan / avgDailyRevenue;
            if (daysNeeded <= daysInMonth - daysPassed) {
                forecastText = `План будет выполнен через ${Math.ceil(daysNeeded)} дней`;
            } else {
                const expectedProgress = (totalRevenue + avgDailyRevenue * (daysInMonth - daysPassed)) / this.planAmount * 100;
                forecastText = `К концу месяца ожидается выполнение плана на ${expectedProgress.toFixed(1)}%`;
            }
        }

        document.querySelector('.salary-forecast').innerHTML += `
            <p>Продано сегодня: ${this.formatCurrency(todaySales)}</p>
            <p>Продано за неделю: ${this.formatCurrency(weeklySales)}</p>
            <p>Средняя выручка в день: ${this.formatCurrency(avgDailyRevenue)}</p>
            <p>${forecastText}</p>
        `;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

const dashboardManager = new DashboardManager();
