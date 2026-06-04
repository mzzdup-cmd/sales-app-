class SalaryManager {

    constructor() {

        this.salaryChart = null;
    }

    async loadSalaryHistory() {

        try {

            const snapshot =
                await db
                    .collection("salaryHistory")
                    .orderBy("month", "asc")
                    .get();

            const tableBody =
                document.querySelector(
                    "#salaryHistory tbody"
                );

            if (!tableBody) return;

            tableBody.innerHTML = "";

            const rows = [];

            snapshot.docs.forEach(doc => {

                const salary = {
                    id: doc.id,
                    ...doc.data()
                };

                rows.push(salary);

                tableBody.innerHTML += `
                    <tr>

                        <td>
                            ${salary.month || "-"}
                        </td>

                        <td>
                            ${this.formatCurrency(
                                salary.revenue
                            )}
                        </td>

                        <td>
                            ${this.formatCurrency(
                                salary.baseSalary
                            )}
                        </td>

                        <td>
                            ${this.formatCurrency(
                                salary.commission
                            )}
                        </td>

                        <td>
                            ${this.formatCurrency(
                                salary.bonus
                            )}
                        </td>

                        <td>
                            <strong>
                                ${this.formatCurrency(
                                    salary.total
                                )}
                            </strong>
                        </td>

                    </tr>
                `;
            });

            this.renderChart(rows);

        } catch (error) {

            console.error(
                "Salary error:",
                error
            );
        }
    }

    renderChart(rows) {

        const canvas =
            document.getElementById(
                "salaryChart"
            );

        if (!canvas) return;

        if (this.salaryChart) {
            this.salaryChart.destroy();
        }

        this.salaryChart =
            new Chart(canvas, {

                type: "bar",

                data: {

                    labels:
                        rows.map(
                            r => r.month
                        ),

                    datasets: [

                        {
                            label: "Выручка",

                            data:
                                rows.map(
                                    r => r.revenue || 0
                                ),

                            backgroundColor:
                                "#3B82F6",

                            borderRadius: 12
                        },

                        {
                            label: "Зарплата",

                            data:
                                rows.map(
                                    r => r.total || 0
                                ),

                            backgroundColor:
                                "#10B981",

                            borderRadius: 12
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            labels: {
                                color: "#fff"
                            }
                        }
                    },

                    scales: {

                        x: {

                            ticks: {
                                color: "#94A3B8"
                            },
                            grid: {
                                display: false
                            }
                        },

                        y: {

                            ticks: {
                                color: "#94A3B8"
                            },

                            grid: {
                                color:
                                    "rgba(255,255,255,.05)"
                            }
                        }
                    }
                }
            });
    }

    formatCurrency(amount) {

        return new Intl.NumberFormat(
            "ru-RU",
            {
                style: "currency",
                currency: "RUB",
                minimumFractionDigits: 0
            }
        ).format(amount || 0);
    }
}

const salaryManager =
    new SalaryManager();
