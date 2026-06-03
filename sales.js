class SalesManager {
    async loadSales() {
        const snapshot = await db.collection('sales').orderBy('date', 'desc').get();
        const salesByDay = {};

        snapshot.docs.forEach(doc => {
            const sale = doc.data();
            const date = new Date(sale.date).toLocaleDateString();

            if (!salesByDay[date]) {
                salesByDay[date] = [];
            }
            salesByDay[date].push({ ...sale, id: doc.id });
        });

        this.displaySalesByDay(salesByDay);
    }

    displaySalesByDay(salesByDay) {
        const container = document.getElementById('salesList');
        container.innerHTML = '';

        Object.keys(salesByDay).forEach(date => {
            const daySales = salesByDay[date];
            const dayElement = document.createElement('div');
            dayElement.className = 'sales-day';

            dayElement.innerHTML = `
                <div class="day-header" onclick="toggleDay('${date}')">
                    <span>${date}</span>
                    <span>▼</span>
                </div>
                <div id="day-${date}" class="day-sales hidden">
                    ${daySales.map(sale => this.createSaleCard(sale)).join('')}
                </div>`;

            container.appendChild(dayElement);
        });
    }

    createSaleCard(sale) {
        return `
            <div class="sale-card">
                <div>
                    <strong>Сумма:</strong> ${this.formatCurrency(sale.amount)}
                </div>
                <div>
                    <strong>Статус:</strong> ${sale.status}
                </div>
                <div>
                    <strong>Ночная смена:</strong> ${sale.nightShift ? 'Да' : 'Нет'}
                </div>
                ${sale.dialogLink ? `<div><strong>Ссылка:</strong> <a href="${sale.dialogLink}" target="_blank">Перейти</a></div>` : ''}
                <button class="delete-btn" onclick="salesManager.deleteSale('${sale.id}')">Удалить</button>
            </div>`;
    }

    async addSale(saleData) {
        await db.collection('sales').add(saleData);
        await this.loadSales();
        dashboardManager.updateStats();
    }

    async deleteSale(saleId) {
        if (confirm('Удалить продажу?')) {
            await db.collection('sales').doc(saleId).delete();
            await this.loadSales();
            dashboardManager.updateStats();
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

const salesManager = new SalesManager();

// Функция для переключения видимости дня
function toggleDay(date) {
    const dayElement = document.getElementById(`day-${date}`);
    dayElement.classList.toggle('hidden');
}
