class SubscriptionsManager {

    async loadSubscriptions() {

        try {
            const snapshot = await db.collection("subscriptions").get();

            const tableBody = document.querySelector("#subscriptionsTable tbody");
            if (!tableBody) return;

            tableBody.innerHTML = "";

            snapshot.docs.forEach(doc => {

                const subscription = {
                    id: doc.id,
                    ...doc.data()
                };

                const row = this.createSubscriptionRow(subscription);
                tableBody.appendChild(row);
            });

        } catch (error) {
            console.error("Subscriptions error:", error);
        }
    }

    createSubscriptionRow(subscription) {

        const tr = document.createElement("tr");

        const payments = subscription.payments || {};
        const dates = this.calculatePaymentDates(subscription.firstPaymentDate);

        tr.innerHTML = `
            <td><a href="${subscription.dialogLink || '#'}" target="_blank">Диалог</a></td>
            <td>${subscription.clientNick || '-'}</td>

            <td>
                <select onchange="subscriptionsManager.updateSubscriptionFormat('${subscription.id}', this.value)">
                    <option value="2/6" ${subscription.format === '2/6' ? 'selected' : ''}>2/6</option>
                    <option value="4/12" ${subscription.format === '4/12' ? 'selected' : ''}>4/12</option>
                    <option value="5.5/22" ${subscription.format === '5.5/22' ? 'selected' : ''}>5.5/22</option>
                    <option value="7/28" ${subscription.format === '7/28' ? 'selected' : ''}>7/28</option>
                    <option value="5/20" ${subscription.format === '5/20' ? 'selected' : ''}>5/20</option>
                </select>
            </td>

            <td>
                ${subscription.firstPaymentDate
                    ? new Date(subscription.firstPaymentDate).toLocaleDateString()
                    : "-"}
            </td>

            <td>
                ${dates.map((date, i) => {

                    const key = payment${i + 1};
                    const isPaid = payments[key];

                    return `
                        <div>
                            <label>
                                <input type="checkbox"
                                    onchange="subscriptionsManager.togglePayment('${subscription.id}', ${i + 1}, this.checked)"
                                    ${isPaid ? "checked" : ""}>
                                Платёж ${i + 1} (${date.toLocaleDateString()})
                            </label>
                        </div>
                    `;
                }).join("")}
            </td>

            <td>${subscription.status || "Активна"}</td>
        `;

        return tr;
    }

    calculatePaymentDates(dateStr) {

        if (!dateStr) return [];

        const start = new Date(dateStr);
        const result = [];

        for (let i = 1; i <= 3; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i * 14);
            result.push(d);
        }

        return result;
    }

    async togglePayment(id, num, val) {

        await db.collection("subscriptions")
            .doc(id)
            .update({
                [`payments.payment${num}`]: val
            });

        this.loadSubscriptions();
    }

    async updateSubscriptionFormat(id, format) {

        await db.collection("subscriptions")
            .doc(id)
            .update({ format });

        this.loadSubscriptions();
    }
}

const subscriptionsManager = new SubscriptionsManager();
