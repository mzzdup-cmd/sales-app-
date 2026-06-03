class SalaryManager {
    async loadSalaryHistory() {
        const snapshot = await db.collection('salaryHistory').orderBy('month', 'desc').get();
        const tableBody = document.querySelector('#salaryHistory tbody');
        tableBody.innerHTML = '';

        snapshot.docs.forEach(doc => {
            const salary = doc.data();
            const row = this.createSalaryRow(salary);
            tableBody.appendChild(row);
        });

        this.updateSalaryCharts();
    }

    createSalaryRow(salary) {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${salary.month}</td>
            <td>${this.formatCurrency(salary.revenue)}</td>
            <td>${this.formatCurrency(salary.baseSalary)}</td>
            <td>${this.formatCurrency(salary.commission)}</td>
            <td>${this.formatCurrency(salary.bonus)}</td>
            <td>${this.formatCurrency(salary.total)}</td>`;

        return tr;
    }

    async updateSalaryCharts() {
        const snapshot = await db.collection('salaryHistory').get();
        const salaries = snapshot.docs.map(doc => doc.data());

        // График выручки по месяцам
        const months = salaries.map(s => s.month);
        const revenues = salaries.map(s => s.revenue);
        const totals = salaries.map(s => s.total);

        new Chart(document.getElementById('salaryChart'), {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                label: 'Выручка',
                data: revenues,
                backgroundColor: '#4a6cf7'
            },
            {
                label: 'Зарплата',
                data: totals,
                backgroundColor: '#38a169'
            }
        ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

const salaryManager = new SalaryManager();
