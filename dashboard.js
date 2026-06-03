class DashboardManager {

    constructor() {
        this.planAmount = 800000;
        this.baseSalary = 50000;
        this.commissionRate = 0.05;
        this.nightShiftBonus = 2000;

        this.bonusThresholds = [
            { threshold: 700000, bonus: 5000 },
            { threshold: 800000, bonus: 10000 }
        ];

        this.planChartInstance = null;
        this.salesChartInstance = null;
    }

    async updateStats() {

        const sales = await this.getSalesForCurrentMonth();

        const totalRevenue = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
        const nightShifts = sales.filter(s => s.nightShift).length;

        const planProgress = Math.min((totalRevenue / this.planAmount) * 100, 100);
        const remainingToPlan = Math.max(this.planAmount - totalRevenue, 0);

        const commission = totalRevenue * this.commissionRate;
        const bonus = this.calculateBonuses(totalRevenue, nightShifts);

        const currentSalary =
            this.baseSalary + commission + bonus;

        // UI
        this.setText("totalRevenue", this.formatCurrency(totalRevenue));
        this.setText("planProgress", `${planProgress.toFixed(1)}%`);
        this.setText("remainingToPlan", this.formatCurrency(remainingToPlan));
        this.setText("salaryForecast", this.formatCurrency(currentSalary));
        this.setText("currentSalary", this.formatCurrency(currentSalary));

        const fullPlanSalary =
            this.baseSalary +
            (this.planAmount * this.commissionRate) +
            this.calculateBonuses(this.planAmount, nightShifts);

        this.setText("fullPlanSalary", this.formatCurrency(fullPlanSalary));

        const nextBonus = this.bonusThresholds.find(b => totalRevenue < b.threshold);

        if (nextBonus) {
            this.setText(
                "bonusProgress",
                this.formatCurrency(nextBonus.threshold - totalRevenue)
            );
        } else {
            this.setText("bonusProgress", "Все бонусы получены");
        }

        this.updateCharts(sales, planProgress);
        this.updateSalaryForecast(totalRevenue, sales);
    }

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    calculateBonuses(revenue, nightShifts) {

        let bonus = nightShifts * this.nightShiftBonus;

        for (const b of this.bonusThresholds) {
            if (revenue >= b.threshold) {
                bonus += b.bonus;
            }
        }

        return bonus;
    }

    async getSalesForCurrentMonth() {

        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);

        const snapshot = await db.collection('sales')
            .where('date', '>=', start.toISOString())
            .get();

        return snapshot.docs.map(d => d.data());
    }

    updateCharts(sales, planProgress) {

        // DESTROY OLD CHARTS (ВАЖНО)
        if (this.planChartInstance) {
            this.planChartInstance.destroy();
        }

        if (this.salesChartInstance) {
            this.salesChartInstance.destroy();
        }

        // PLAN CHART
        const planCtx = document.getElementById("planChart");
        if (planCtx) {

            this.planChartInstance = new Chart(planCtx, {
                type: "doughnut",
                data: {
                    labels: ["Выполнено", "Осталось"],
                    datasets: [{
                        data: [planProgress, 100 - planProgress],
                        backgroundColor: ["#4a6cf7", "#e2e8f0"]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // SALES CHART
        const grouped = this.groupByDay(sales);

        const labels = Object.keys(grouped);
        const values = Object.values(grouped);

        const salesCtx = document.getElementById("salesChart");

        if (salesCtx) {

            this.salesChartInstance = new Chart(salesCtx, {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: "Продажи",
                        data: values,
                        borderColor: "#4a6cf7",
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    groupByDay(sales) {

        const map = {};

        sales.forEach(s => {

            const d = new Date(s.date).toLocaleDateString();

            map[d] = (map[d]  0) + (s.amount  0);
        });

        return map;
    }

    updateSalaryForecast(totalRevenue, sales) {

        const forecastBlock = document.querySelector(".salary-forecast");
        if (!forecastBlock) return;

        const today = new Date();
        const days = today.getDate();

        const avg = days > 0 ? totalRevenue / days : 0;

        const todaySales = sales
            .filter(s => new Date(s.date).toDateString() === today.toDateString())
            .reduce((sum, s) => sum + (s.amount || 0), 0);

        const weekSales = sales
            .filter(s => new Date(s.date) >= new Date(Date.now() - 7 * 86400000))
            .reduce((sum, s) => sum + (s.amount || 0), 0);

        forecastBlock.innerHTML = `
            <h3>Моя зарплата</h3>

            <p>Сегодня: ${this.formatCurrency(todaySales)}</p>
            <p>Неделя: ${this.formatCurrency(weekSales)}</p>
            <p>Среднее в день: ${this.formatCurrency(avg)}</p>
        `;
    }

    formatCurrency(amount) {

        return new Intl.NumberFormat("ru-RU", {
            style: "currency",
            currency: "RUB"
        }).format(amount || 0);
    }
}

const dashboardManager = new DashboardManager();
