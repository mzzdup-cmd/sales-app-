class SalesManager {

    async loadSales() {
        try {
            const snapshot = await db.collection("sales")
                .orderBy("date", "desc")
                .get();

            const salesByDay = {};

            snapshot.docs.forEach(doc => {
                const sale = { id: doc.id, ...doc.data() };
                const date = sale.date ? new Date(sale.date).toLocaleDateString() : "Без даты";

                if (!salesByDay[date]) salesByDay[date] = [];
                salesByDay[date].push(sale);
            });

            this.renderSales(salesByDay);

        } catch (error) {
            console.error("Ошибка загрузки продаж:", error);
        }
    }

    renderSales(salesByDay) {
        const container = document.getElementById("salesList");
        if (!container) return;

        container.innerHTML = "";

        const dates = Object.keys(salesByDay);
        if (!dates.length) {
            container.innerHTML = <div class="sale-card">Продаж пока нет</div>;
            return;
        }

        dates.forEach(date => {
            const sales = salesByDay[date];
            const total = sales.reduce((sum, s) => sum + (s.amount || 0), 0);

            const block = document.createElement("div");
            block.className = "sales-day";

            block.innerHTML = `
                <div class="day-header" onclick="toggleDay('${date}')">
                    <span>${date} — всего: ${this.formatCurrency(total)}</span>
                    <span>▼</span>
                </div>
                <div id="day-${date}" class="day-sales hidden">
                    ${sales.map(s => this.createSaleCard(s)).join("")}
                </div>
            `;

            container.appendChild(block);
        });
    }

    createSaleCard(sale) {
        return `
            <div class="sale-card">
                <p>💰 <strong>${this.formatCurrency(sale.amount || 0)}</strong></p>
                <p>📌 Статус: ${sale.status || "-"}</p>
                <p>🌙 Ночная: ${sale.nightShift ? "Да" : "Нет"}</p>
                ${sale.dialogLink ? <p>🔗 <a href="${sale.dialogLink}" target="_blank">Открыть диалог</a></p> : ""}
                <button class="delete-btn" onclick="salesManager.deleteSale('${sale.id}')">Удалить</button>
            </div>
        `;
    }

    async addSale(saleData) {
        try {
            const docRef = await db.collection("sales").add(saleData);

            // Создание подписки автоматически, если статус "Подписная"
            if (saleData.status === "Подписная" && subscriptionsManager) {
                await db.collection("subscriptions").add({
                    clientNick: "Клиент",
                    dialogLink: saleData.dialogLink || "",
                    format: "2/6",
                    firstPaymentDate: saleData.date,
                    payments: {},
                    status: "Активна",
                    sourceSaleId: docRef.id
                });
            }

            await this.loadSales();
            dashboardManager?.updateStats();
            subscriptionsManager?.loadSubscriptions();

        } catch (error) {
            console.error("Ошибка сохранения продажи:", error);
        }
    }

    async deleteSale(saleId) {
        const confirmed = confirm("Удалить продажу?");
        if (!confirmed) return;

        try {
            await db.collection("sales").doc(saleId).delete();
            await this.loadSales();
            dashboardManager?.updateStats();
            subscriptionsManager?.loadSubscriptions();
        } catch (error) {
            console.error("Ошибка удаления продажи:", error);
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat("ru-RU", {
            style: "currency",
            currency: "RUB",
            minimumFractionDigits: 0
        }).format(amount || 0);
    }
}

const salesManager = new SalesManager();

// Функция для раскрытия списка продаж дня
function toggleDay(date) {
    const el = document.getElementById(`day-${date}`);
    if (el) el.classList.toggle("hidden");
}
