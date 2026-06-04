class SalesManager {

    async loadSales() {

        try {

            const snapshot = await db
                .collection("sales")
                .orderBy("date", "desc")
                .get();

            const salesByDay = {};

            snapshot.docs.forEach(doc => {

                const sale = {
                    id: doc.id,
                    ...doc.data()
                };

                const date = sale.date || "Без даты";

                if (!salesByDay[date]) {
                    salesByDay[date] = [];
                }

                salesByDay[date].push(sale);
            });

            this.renderSales(salesByDay);

        } catch (error) {

            console.error(
                "Ошибка загрузки продаж:",
                error
            );
        }
    }

    renderSales(salesByDay) {

        const container =
            document.getElementById("salesList");

        if (!container) return;

        container.innerHTML = "";

        const dates =
            Object.keys(salesByDay);

        if (!dates.length) {

            container.innerHTML = `
                <div class="sale-card empty">
                    Продаж пока нет
                </div>
            `;

            return;
        }

        dates.forEach(date => {

            const sales =
                salesByDay[date];

            const total =
                sales.reduce(
                    (sum, sale) =>
                        sum + (sale.amount || 0),
                    0
                );

            const block =
                document.createElement("div");

            block.className =
                "sales-day";

            block.innerHTML = `
                <div
                    class="day-header"
                    onclick="toggleDay('${date}')"
                >

                    <div class="day-info">
                        <h3>${this.formatDate(date)}</h3>

                        <p>
                            ${sales.length} продаж
                        </p>
                    </div>

                    <div class="day-right">
                        <strong>
                            ${this.formatCurrency(total)}
                        </strong>

                        <span class="arrow">
                            ▼
                        </span>
                    </div>

                </div>

                <div
                    id="day-${date}"
                    class="day-sales hidden"
                >

                    ${sales.map(
                        sale =>
                            this.createSaleCard(sale)
                    ).join("")}

                </div>
            `;

            container.appendChild(block);
        });
    }

    createSaleCard(sale) {

        return `
            <div class="sale-card">

                <div class="sale-top">

                    <div class="sale-price">
                        ${this.formatCurrency(
                            sale.amount || 0
                        )}
                    </div>

                    <div class="
                        sale-status
                        ${this.getStatusClass(sale.status)}
                    ">
                        ${sale.status || "-"}
                    </div>

                </div>

                <div class="sale-bottom">

                    <div class="sale-meta">
                        🌙 Ночная:
                        ${sale.nightShift ? "Да" : "Нет"}
                    </div>

                    ${
                        sale.dialogLink
                        ?
                        `
                        <a
                            class="sale-link"
                            href="${sale.dialogLink}"
                            target="_blank"
                        >
                            Открыть диалог
                        </a>
                        `
                        :
                        ""
                    }

                </div>

                <button 
                class="delete-btn"
                    onclick="salesManager.deleteSale('${sale.id}')"
                >
                    Удалить
                </button>

            </div>
        `;
    }

    async addSale(saleData) {

        try {

            const docRef =
                await db
                    .collection("sales")
                    .add(saleData);

            // автоматическое создание подписки
            if (
                saleData.status === "Подписная"
            ) {

                await db
                    .collection("subscriptions")
                    .add({

                        clientNick:
                            "Новый клиент",

                        dialogLink:
                            saleData.dialogLink || "",

                        format:
                            "2/6",

                        firstPaymentDate:
                            saleData.date,

                        payments: {},

                        status:
                            "Активна",

                        sourceSaleId:
                            docRef.id
                    });
            }

            await this.loadSales();

            dashboardManager?.updateStats();

            subscriptionsManager?.loadSubscriptions();

        } catch (error) {

            console.error(
                "Ошибка сохранения:",
                error
            );
        }
    }

    async deleteSale(saleId) {

        const confirmed =
            confirm("Удалить продажу?");

        if (!confirmed) return;

        try {

            await db
                .collection("sales")
                .doc(saleId)
                .delete();

            await this.loadSales();

            dashboardManager?.updateStats();

        } catch (error) {

            console.error(
                "Ошибка удаления:",
                error
            );
        }
    }

    getStatusClass(status) {

        switch (status) {

            case "Полная":
                return "green";

            case "Подписная":
                return "blue";

            case "Доплата":
                return "yellow";

            case "ББ":
                return "red";

            default:
                return "";
        }
    }

    formatDate(date) {

        try {

            return new Date(date)
                .toLocaleDateString(
                    "ru-RU",
                    {
                        day: "numeric",
                        month: "long"
                    }
                );

        } catch {

            return date;
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

const salesManager =
    new SalesManager();

function toggleDay(date) {

    const el =
        document.getElementById(
            day-${date}
        );

    if (!el) return;

    el.classList.toggle("hidden");
}
