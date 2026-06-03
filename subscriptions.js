class SubscriptionsManager {

    async loadSubscriptions() {
        try {
            const snapshot = await db.collection("subscriptions").get();

            const tableBody = document.querySelector("#subscriptionsTable tbody");
            if (!tableBody) return;

            tableBody.innerHTML = "";

            let activeCount = 0;
            let completedCount = 0;
            let lostCount = 0;
            let futurePayments = 0;

            snapshot.docs.forEach(doc => {
                const subscription = {
                    id: doc.id,
                    ...doc.data()
                };

                const row = this.createSubscriptionRow(subscription);
                tableBody.appendChild(row);

                if (subscription.status === "Активна") activeCount++;
                if (subscription.status === "Оплачено") completedCount++;
                if (subscription.status === "Слив") lostCount++;

                if (subscription.status === "Активна") {
                    futurePayments += this.calculateFuturePayments(subscription);
                }
            });

            this.updateSubscriptionStats(activeCount, completedCount, lostCount, futurePayments);

        } catch (error) {
            console.error("Subscriptions error:", error);
        }
    }

    createSubscriptionRow(subscription) {

        const tr = document.createElement("tr");

        const payments = subscription.payments || {};
        const paymentDates = this.calculatePaymentDates(subscription.firstPaymentDate);

        tr.innerHTML = `
            <td>
                <a href="${subscription.dialogLink || "#"}" target="_blank">
                    Диалог
                </a>
            </td>

            <td>${subscription.clientNick || "-"}</td>

            <td>
                <select onchange="subscriptionsManager.updateSubscriptionFormat('${subscription.id}', this.value)">
                    <option value="2/6" ${subscription.format === "2/6" ? "selected" : ""}>2/6</option>
                    <option value="4/12" ${subscription.format === "4/12" ? "selected" : ""}>4/12</option>
                    <option value="5.5/22" ${subscription.format === "5.5/22" ? "selected" : ""}>5.5/22</option>
                    <option value="7/28" ${subscription.format === "7/28" ? "selected" : ""}>7/28</option>
                    <option value="5/20" ${subscription.format === "5/20" ? "selected" : ""}>5/20</option>
                </select>
            </td>

            <td>
                ${
                    subscription.firstPaymentDate
                        ? new Date(subscription.firstPaymentDate).toLocaleDateString()
                        : "-"
                }
            </td>

            <td>
                ${paymentDates.map((date, index) => {
                    const key = payment${index + 1};
                    const isPaid = payments[key];

                    return `
                        <div>
                            <label>
                                <input type="checkbox"
                                    onchange="subscriptionsManager.togglePayment('${subscription.id}', ${index + 1}, this.checked)"
                                    ${isPaid ? "checked" : ""}>
                                Платёж ${index + 1} (${date.toLocaleDateString()})
                            </label>
                        </div>
                    `;
                }).join("")}
            </td>

            <td>${subscription.status || "Активна"}</td>
        `;

        return tr;
    }

    calculatePaymentDates(firstPaymentDate) {
        if (!firstPaymentDate) return [];

        const dates = [];
        const start = new Date(firstPaymentDate);

        for (let i = 1; i <= 3; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i * 14);
            dates.push(d);
        }

        return dates;
    }

    calculateFuturePayments(subscription) {
        let total = 0;

        const parts = (subscription.format || "0/0").split("/");
        const amount = parseFloat(parts[0]) || 0;

        const payments = subscription.payments || {};

        for (let i = 1; i <= 3; i++) {
            if (!payments[`payment${i}`]) {
                total += amount * 1000;
            }
        }

        return total;
    }

    updateSubscriptionStats(active, completed, lost, future) {
        const el = document.querySelector(".subscription-stats");

        if (!el) return;

        el.innerHTML = `
            <div class="stat-card"><h3>Активные</h3><p>${active}</p></div>
            <div class="stat-card"><h3>Оплачено</h3><p>${completed}</p></div>
            <div class="stat-card"><h3>Слив</h3><p>${lost}</p></div>
            <div class="stat-card"><h3>Ожидаемая сумма</h3><p>${this.formatCurrency(future)}</p></div>
        `;
    }

    async togglePayment(subscriptionId, paymentNumber, isPaid) {
        await db.collection("subscriptions")
            .doc(subscriptionId)
            .update({
                [`payments.payment${paymentNumber}`]: isPaid
            });

        await this.checkSubscriptionStatus(subscriptionId);
        await this.loadSubscriptions();
    }

    async checkSubscriptionStatus(subscriptionId) {
        const doc = await db.collection("subscriptions").doc(subscriptionId).get();
        const subscription = doc.data();

        const payments = subscription.payments || {};

        const allPaid = Object.keys(payments).length > 0 &&
            Object.values(payments).every(v => v);

        if (allPaid) {
            await db.collection("subscriptions")
                .doc(subscriptionId)
                .update({ status: "Оплачено" });
            return;
        }

        const today = new Date();
        const dates = this.calculatePaymentDates(subscription.firstPaymentDate);

        for (let i = 0; i < dates.length; i++) {
            const key = payment${i + 1};

            if (!payments[key] && dates[i] < today) {
                await db.collection("subscriptions")
                    .doc(subscriptionId)
                    .update({ status: "Слив" });
                break;
            }
        }
    }

    async updateSubscriptionFormat(subscriptionId, newFormat) {
        await db.collection("subscriptions")
            .doc(subscriptionId)
            .update({ format: newFormat });

        await this.loadSubscriptions();
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat("ru-RU", {
            style: "currency",
            currency: "RUB",
            minimumFractionDigits: 0
        }).format(amount || 0);
    }
}

const subscriptionsManager = new SubscriptionsManager();
