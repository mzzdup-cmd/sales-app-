class SubscriptionsManager {
    async loadSubscriptions() {
        const snapshot = await db.collection('subscriptions').get();
        const tableBody = document.querySelector('#subscriptionsTable tbody');
        tableBody.innerHTML = '';

        let activeCount = 0;
        let completedCount = 0;
        let lostCount = 0;
        let futurePayments = 0;

        snapshot.docs.forEach(doc => {
            const subscription = doc.data();
            const row = this.createSubscriptionRow(subscription);
            tableBody.appendChild(row);

            // Подсчёт статистики
            switch (subscription.status) {
                case 'Активна':
                    activeCount++;
                    break;
                case 'Оплачено':
                    completedCount++;
                    break;
                case 'Слив':
                    lostCount++;
                    break;
            }

            // Расчёт будущих платежей
            if (subscription.status === 'Активна') {
                futurePayments += this.calculateFuturePayments(subscription);
            }
        });

        this.updateSubscriptionStats(activeCount, completedCount, lostCount, futurePayments);
    }

    createSubscriptionRow(subscription) {
        const tr = document.createElement('tr');

        // Расчёт дат платежей
        const paymentDates = this.calculatePaymentDates(subscription.firstPaymentDate);

        tr.innerHTML = `
            <td><a href="${subscription.dialogLink}" target="_blank">Ссылка</a></td>
            <td>${subscription.clientNick}</td>
            <td>
                <select class="format-select" onchange="subscriptionsManager.updateSubscriptionFormat('${subscription.id}', this.value)">
                    <option value="2/6" ${subscription.format === '2/6' ? 'selected' : ''}>2/6</option>
            <option value="4/12" ${subscription.format === '4/12' ? 'selected' : ''}>4/12</option>
            <option value="5.5/22" ${subscription.format === '5.5/22' ? 'selected' : ''}>5.5/22</option>
            <option value="7/28" ${subscription.format === '7/28' ? 'selected' : ''}>7/28</option>
            <option value="5/20" ${subscription.format === '5/20' ? 'selected' : ''}>5/20</option>
        </select>
            </td>
            <td>${new Date(subscription.firstPaymentDate).toLocaleDateString()}</td>
            <td>
                ${paymentDates.map((date, index) => `
                    <div>
                <label>
                    <input type="checkbox"
                           onchange="subscriptionsManager.togglePayment('${subscription.id}', ${index + 1}, this.checked)"
                           ${subscription.payments?.[`payment${index + 1}`] ? 'checked' : ''}>
                    Платеж ${index + 2} (${date.toLocaleDateString()})
                </label>
            </div>
        `).join('')}
            </td>
            <td class="status-${subscription.status.toLowerCase()}">${subscription.status}</td>`;

        return tr;
    }

    calculatePaymentDates(firstPaymentDate) {
        const dates = [];
        const startDate = new Date(firstPaymentDate);

        for (let i = 1; i < 4; i++) {
            const nextDate = new Date(startDate);
            nextDate.setDate(startDate.getDate() + i * 14);
            dates.push(nextDate);
        }

        return dates;
    }

    calculateFuturePayments(subscription) {
        let total = 0;
        const formatParts = subscription.format.split('/');
        const paymentAmount = parseFloat(formatParts[0]);

        // Считаем неоплаченные платежи
        for (let i = 1; i <= 3; i++) {
            if (!subscription.payments?.[`payment${i}`]) {
                total += paymentAmount * 1000; // Предполагаем, что формат в тысячах рублей
            }
        }

        return total;
    }

    updateSubscriptionStats(active, completed, lost, future) {
        document.querySelector('.subscription-stats').innerHTML = `
            <p>Активных: ${active}</p>
            <p>Завершенных: ${completed}</p>
            <p>Сливов: ${lost}</p>
            <p>Ожидаемая сумма: ${this.formatCurrency(future)}</p>`;
    }

    async togglePayment(subscriptionId, paymentNumber, isPaid) {
        await db.collection('subscriptions')
            .doc(subscriptionId)
            .update({
                [`payments.payment${paymentNumber}`]: isPaid
            });
        await this.checkSubscriptionStatus(subscriptionId);
        await this.loadSubscriptions();
    }

        async checkSubscriptionStatus(subscriptionId) {
        const doc = await db.collection('subscriptions').doc(subscriptionId).get();
        const subscription = doc.data();

        // Проверка всех платежей
        const allPaid = Object.values(subscription.payments || {}).every(paid => paid);

        if (allPaid) {
            await db.collection('subscriptions')
                .doc(subscriptionId)
                .update({ status: 'Оплачено' });
        } else {
            // Проверка просроченных платежей
            const today = new Date();
            const paymentDates = this.calculatePaymentDates(subscription.firstPaymentDate);

            for (let i = 0; i < paymentDates.length; i++) {
                const paymentNum = i + 1;
                const isPaid = subscription.payments?.[`payment${paymentNum}`];
                const dueDate = paymentDates[i];

                if (!isPaid && dueDate < today) {
                    await db.collection('subscriptions')
                        .doc(subscriptionId)
                        .update({ status: 'Слив' });
                    break;
                }
            }
        }
    }

    async updateSubscriptionFormat(subscriptionId, newFormat) {
        await db.collection('subscriptions')
            .doc(subscriptionId)
            .update({ format: newFormat });
        await this.loadSubscriptions();
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

const subscriptionsManager = new SubscriptionsManager();
