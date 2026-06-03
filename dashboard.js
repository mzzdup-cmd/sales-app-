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

    try {

        const sales =
            await this.getSalesForCurrentMonth();

        const totalRevenue =
            sales.reduce(
                (sum, sale) => sum + Number(sale.amount || 0),
                0
            );

        const nightShifts =
            sales.filter(
                sale => sale.nightShift
            ).length;

        const planProgress =
            (totalRevenue / this.planAmount) * 100;

        const remainingToPlan =
            Math.max(
                this.planAmount - totalRevenue,
                0
            );

        const commission =
            totalRevenue * this.commissionRate;

        const bonus =
            this.calculateBonuses(
                totalRevenue,
                nightShifts
            );

        const currentSalary =
            this.baseSalary +
            commission +
            bonus;

        document.getElementById(
            "totalRevenue"
        ).textContent =
            this.formatCurrency(totalRevenue);

        document.getElementById(
            "planProgress"
        ).textContent =
            `${planProgress.toFixed(1)}%`;

        document.getElementById(
            "remainingToPlan"
        ).textContent =
            this.formatCurrency(
                remainingToPlan
            );

        document.getElementById(
            "salaryForecast"
        ).textContent =
            this.formatCurrency(
                currentSalary
            );

        document.getElementById(
            "currentSalary"
        ).textContent =
            this.formatCurrency(
                currentSalary
            );

        const fullPlanSalary =
            this.baseSalary +
            (this.planAmount * this.commissionRate) +
            this.calculateBonuses(
                this.planAmount,
                nightShifts
            );

        document.getElementById(
            "fullPlanSalary"
        ).textContent =
            this.formatCurrency(
                fullPlanSalary
            );

        const nextBonus =
            this.bonusThresholds.find(
                b => totalRevenue < b.threshold
            );

        if (nextBonus) {

            document.getElementById(
                "bonusProgress"
            ).textContent =
                this.formatCurrency(
                    nextBonus.threshold -
                    totalRevenue
                );

        } else {

            document.getElementById(
                "bonusProgress"
            ).textContent =
                "Все бонусы получены";
        }

        this.updateCharts(
            sales,
            Math.min(planProgress, 100)
        );

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}

calculateBonuses(
    revenue,
    nightShifts
) {

    let bonus =
        nightShifts *
        this.nightShiftBonus;

    this.bonusThresholds.forEach(
        item => {

            if (
                revenue >= item.threshold
            ) {
                bonus += item.bonus;
            }
        }
    );

    return bonus;
}

async getSalesForCurrentMonth() {

    const snapshot =
        await db
            .collection("sales")
            .get();

    return snapshot.docs.map(
        doc => doc.data()
    );
}

updateCharts(
    sales,
    planProgress
) {

    const planCanvas =
        document.getElementById(
            "planChart"
        );

    const salesCanvas =
        document.getElementById(
            "salesChart"
        );

    if (
        !planCanvas ||
        !salesCanvas
    ) {
        return;
    }

    if (this.planChart) {
        this.planChart.destroy();
    }
    if (this.salesChart) {
        this.salesChart.destroy();
    }

    this.planChart =
        new Chart(planCanvas, {

            type: "doughnut",

            data: {

                labels: [
                    "Выполнено",
                    "Осталось"
                ],

                datasets: [{
                    data: [
                        planProgress,
                        100 - planProgress
                    ]
                }]
            }
        });

    const grouped =
        this.groupSalesByDay(
            sales
        );

    this.salesChart =
        new Chart(salesCanvas, {

            type: "line",

            data: {

                labels:
                    Object.keys(grouped),

                datasets: [{

                    label:
                        "Продажи",

                    data:
                        Object.values(grouped)
                }]
            }
        });
}

groupSalesByDay(
    sales
) {

    const grouped = {};

    sales.forEach(
        sale => {

            const date =
                sale.date || "Без даты";

            if (!grouped[date]) {
                grouped[date] = 0;
            }

            grouped[date] +=
                Number(
                    sale.amount || 0
                );
        }
    );

    return grouped;
}

formatCurrency(
    amount
) {

    return new Intl.NumberFormat(
        "ru-RU",
        {
            style: "currency",
            currency: "RUB",
            minimumFractionDigits: 0
        }
    ).format(amount);
}
}
const dashboardManager =
new DashboardManager();
