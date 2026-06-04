class SubscriptionsManager {

    async loadSubscriptions() {

        try {

            const snapshot =
                await db
                    .collection("subscriptions")
                    .orderBy("firstPaymentDate", "desc")
                    .get();

            const tableBody =
                document.querySelector(
                    "#subscriptionsTable tbody"
                );

            if (!tableBody) return;

            tableBody.innerHTML = "";

            let active = 0;
            let completed = 0;
            let lost = 0;
            let future = 0;

            snapshot.docs.forEach(doc => {

                const subscription = {
                    id: doc.id,
                    ...doc.data()
                };

                const row =
                    this.createRow(subscription);

                tableBody.appendChild(row);

                if (
                    subscription.status ===
                    "Активна"
                ) {
                    active++;
                }

                if (
                    subscription.status ===
                    "Оплачено"
                ) {
                    completed++;
                }

                if (
                    subscription.status ===
                    "Слив"
                ) {
                    lost++;
                }

                if (
                    subscription.status ===
                    "Активна"
                ) {
                    future +=
                        this.calculateFuturePayments(
                            subscription
                        );
                }
            });

            this.renderStats(
                active,
                completed,
                lost,
                future
            );

        } catch (error) {

            console.error(
                "Ошибка подписок:",
                error
            );
        }
    }

    createRow(subscription) {

        const tr =
            document.createElement("tr");

        const payments =
            subscription.payments || {};

        const dates =
            this.calculatePaymentDates(
                subscription.firstPaymentDate
            );

        tr.innerHTML = `
            <td>

                ${
                    subscription.dialogLink
                    ?
                    `
                    <a
                        href="${subscription.dialogLink}"
                        target="_blank"
                        class="sale-link"
                    >
                        Открыть
                    </a>
                    `
                    :
                    "-"
                }

            </td>

            <td>
                ${subscription.clientNick || "-"}
            </td>

            <td>

                <select
                    class="subscription-select"
                    onchange="
                        subscriptionsManager.updateFormat(
                            '${subscription.id}',
                            this.value
                        )
                    "
                >

                    ${[
                        "2/6",
                        "4/12",
                        "5.5/22",
                        "7/28",
                        "5/20"
                    ].map(format => `

                        <option
                            value="${format}"
                            ${
                                subscription.format === format
                                ? "selected"
                                : ""
                            }
                        >
                            ${format}
                        </option>

                    `).join("")}

                </select>

            </td>

            <td>
                ${
                    subscription.firstPaymentDate
                    ?
                    new Date(
                        subscription.firstPaymentDate
                    ).toLocaleDateString("ru-RU")
                    :
                    "-"
                }
            </td>

            <td>

                ${dates.map((date, index) => {

                    const key =
                        payment${index + 1};

                    const paid =
                        payments[key];

                    const overdue =
                        !paid &&
                        new Date(date) < new Date();

                    return `

                        <div
                            class="
                                payment-item
                                ${overdue ? "overdue" : ""}
                            "
                        >

                            <label>

                                <input
                                    type="checkbox"

                                    ${
                                        paid
                                        ? "checked"
                                        : ""
                                    }

                                    onchange="
                                        subscriptionsManager.togglePayment(
                                            '${subscription.id}',
                                            ${index + 1},
                                            this.checked
                                        )
                                    "
                                >

                                Платёж ${index + 1}

                                <span>
                                    ${date.toLocaleDateString("ru-RU")}
                                </span>

                            </label>

                        </div>
                    `;

                }).join("")}

            </td>

            <td>

                <div class="
                    sub-status
                    ${this.getStatusClass(subscription.status)}
                ">

                    ${subscription.status || "Активна"}

                </div>

            </td>
        `;

        return tr;
    }

    calculatePaymentDates(firstDate) {

        if (!firstDate) return [];

        const dates = [];

        const start =
            new Date(firstDate);

        for (let i = 1; i <= 3; i++) {

            const d =
                new Date(start);

            d.setDate(
                start.getDate() + (14 * i)
            );

            dates.push(d);
        }

        return dates;
    }

    calculateFuturePayments(subscription) {

        const payments =
            subscription.payments || {};

        const format =
            (subscription.format || "0/0")
                .split("/");

        const amount =
            parseFloat(format[0]) || 0;

        let total = 0;

        for (let i = 1; i <= 3; i++) {

            if (!payments[`payment${i}`]) {

                total +=
                    amount * 1000;
            }
        }

        return total;
    }

    renderStats(
        active,
        completed,
        lost,
        future
    ) {

        const container =
            document.querySelector(
                ".subscription-stats"
            );

        if (!container) return;

        container.innerHTML = `

            <div class="stat-card">
                <h3>Активные</h3>
                <p>${active}</p>
            </div>

            <div class="stat-card">
                <h3>Оплачено</h3>
                <p>${completed}</p>
            </div>

            <div class="stat-card">
                <h3>Слив</h3>
                <p>${lost}</p>
            </div>

            <div class="stat-card">
                <h3>Будущие оплаты</h3>
                <p>${this.formatCurrency(future)}</p>
            </div>

        `;
    }

    async togglePayment(
        subscriptionId,
        paymentNumber,
        isPaid
    ) {

        await db
            .collection("subscriptions")
            .doc(subscriptionId)
            .update({
                [`payments.payment${paymentNumber}`]:
                 isPaid
            });

        await this.checkStatus(
            subscriptionId
        );

        this.loadSubscriptions();
    }

    async checkStatus(subscriptionId) {

        const doc =
            await db
                .collection("subscriptions")
                .doc(subscriptionId)
                .get();

        const subscription =
            doc.data();

        const payments =
            subscription.payments || {};

        const allPaid =
            Object.keys(payments).length > 0 &&
            Object.values(payments).every(v => v);

        if (allPaid) {

            await db
                .collection("subscriptions")
                .doc(subscriptionId)
                .update({
                    status: "Оплачено"
                });

            return;
        }

        const dates =
            this.calculatePaymentDates(
                subscription.firstPaymentDate
            );

        for (let i = 0; i < dates.length; i++) {

            const key =
                payment${i + 1};

            const paid =
                payments[key];

            const overdue =
                !paid &&
                dates[i] < new Date();

            if (overdue) {

                await db
                    .collection("subscriptions")
                    .doc(subscriptionId)
                    .update({
                        status: "Слив"
                    });

                break;
            }
        }
    }

    async updateFormat(id, format) {

        await db
            .collection("subscriptions")
            .doc(id)
            .update({
                format
            });

        this.loadSubscriptions();
    }

    getStatusClass(status) {

        switch (status) {

            case "Активна":
                return "yellow";

            case "Оплачено":
                return "green";

            case "Слив":
                return "red";

            default:
                return "";
        }
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

const subscriptionsManager =
    new SubscriptionsManager();
                    
