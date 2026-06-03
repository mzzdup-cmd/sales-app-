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

        this.planChart = null;
        this.salesChart = null;
    }

    async updateStats() {
        const sales = await this.getSalesForCurrentMonth();

        const totalRevenue = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
        const nightShifts = sales.filter(s => s.nightShift).length;

        const planProgress = Math.min((totalRevenue / this.planAmount) * 100, 100);
        const remainingToPlan = Math.max(this.planAmount - totalRevenue, 0);

        const commission = totalRevenue * this.commissionRate;
        const bonus = this.calculateBonuses(totalRevenue, nightShifts);
        const currentSalary = this.baseSalary + commission + bonus;

        document.getElementById("totalRevenue").textContent =
            this.formatCurrency(totalRevenue);

        document.getElementById("planProgress").textContent =
            planProgress.toFixed(1) + "%";

        document.getElementById("remainingToPlan").textContent =
            this.formatCurrency(remainingToPlan);

        document.getElementById("salaryForecast").textContent =
            this.formatCurrency(currentSalary);

        document.getElementById("currentSalary").textContent =
            this.formatCurrency(currentSalary);

        const fullPlanSalary =
            this.baseSalary +
            (this.planAmount * this.commissionRate) +
            this.calculateBonuses(this.planAmount, nightShifts);

        document.getElementById("fullPlanSalary").textContent =
            this.formatCurrency(fullPlanSalary);

        const nextBonus = this.bonusThresholds.find(b => totalRevenue < b.threshold);

        document.getElementById("bonusProgress").textContent =
            nextBonus
                ? this.formatCurrency(nextBonus.threshold - totalRevenue)
                : "Все бонусы получены";

        this.updateCharts(sales, planProgress);
    }

    async getSalesForCurrentMonth() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const snapshot = await db.collection("sales")
            .where("date", ">=", startOfMonth.toISOString().split("T")[0])
            .get();

        return snapshot.docs.map(doc => doc.data());
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

    updateCharts(sales, planProgress) {

        const planCtx = document.getElementById("planChart");
        const salesCtx = document.getElementById("salesChart");

        if (!planCtx || !salesCtx) return;

        // destroy старые графики (ВАЖНО!)
        if (this.planChart) this.planChart.destroy();
        if (this.salesChart) this.salesChart.destroy();

        this.planChart = new Chart(planCtx, {
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

        const daily = this.groupByDay(sales);

        this.salesChart = new Chart(salesCtx, {
            type: "line",
            data: {
                labels: Object.keys(daily),
                datasets: [{
                    label: "Продажи",
                    data: Object.values(daily),
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

    groupByDay(sales) {
        const result = {};

        sales.forEach(s => {
            const key = new Date(s.date).toLocaleDateString();

            if (!result[key]) result[key] = 0;
            result[key] += s.amount || 0;
        });

        return result;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat("ru-RU", {
            style: "currency",
            currency: "RUB",
            minimumFractionDigits: 0
        }).format(amount || 0);
    }
}

const dashboardManager = new DashboardManager();
