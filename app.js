class App {

    constructor() {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

                this.bindEvents();

                this.initApp();
            }
        );
    }

    initApp() {

        try {

            authManager?.checkAuth();

            this.refreshAll();

        } catch (error) {

            console.error(
                "Init error:",
                error
            );
        }
    }

    bindEvents() {

        // LOGIN

        document
            .getElementById("loginBtn")
            ?.addEventListener(
                "click",
                () => {

                    const password =
                        document.getElementById(
                            "passwordInput"
                        ).value || "";

                    authManager?.login(password);
                }
            );

        // LOGOUT

        document
            .getElementById("logoutBtn")
            ?.addEventListener(
                "click",
                () => {

                    authManager?.logout();
                }
            );

        // NAVIGATION

        document
            .querySelectorAll(".nav-btn")
            .forEach(btn => {

                btn.addEventListener(
                    "click",
                    e => this.switchTab(e)
                );
            });

        // OPEN SALE MODAL

        document
            .getElementById("addSaleBtn")
            ?.addEventListener(
                "click",
                () => {

                    document
                        .getElementById("saleModal")
                        ?.classList.remove("hidden");
                }
            );

        // CLOSE MODAL

        document
            .querySelector(".close")
            ?.addEventListener(
                "click",
                () => {

                    document
                        .getElementById("saleModal")
                        ?.classList.add("hidden");
                }
            );

        // SUBMIT SALE

        document
            .getElementById("saleForm")
            ?.addEventListener(
                "submit",
                async e => {

                    e.preventDefault();

                    const saleData = {

                        date:
                            document.getElementById(
                                "saleDate"
                            ).value,

                        amount:
                            Number(
                                document.getElementById(
                                    "saleAmount"
                                ).value || 0
                            ),

                        status:
                            document.getElementById(
                                "saleStatus"
                            ).value,
                        clientName:
    document.getElementById(
        "clientName"
    ).value,

                        nightShift:
                            document.getElementById(
                                "nightShift"
                            ).checked,

                        dialogLink:
                            document.getElementById(
                                "dialogLink"
                            ).value || ""
                    };

                    await salesManager?.addSale(
                        saleData
                    );

                    document
                        .getElementById("saleModal")
                        ?.classList.add("hidden");

                    document
                        .getElementById("saleForm")
                        ?.reset();
                }
            );

        // ADD SUBSCRIPTION

        document
            .getElementById("addSubscriptionBtn")
            ?.addEventListener(
                "click",
                async () => {

                    try {

                        await db
                            .collection("subscriptions")
                            .add({

                                clientNick:
                                    "Новый клиент",
                                dialogLink: "",

                                format:
                                    "2/6",

                                firstPaymentDate:
                                    new Date()
                                        .toISOString()
                                        .split("T")[0],

                                payments: {},

                                status:
                                    "Активна"
                            });

                        subscriptionsManager
                            ?.loadSubscriptions();

                    } catch (error) {

                        console.error(
                            "Subscription add error:",
                            error
                        );
                    }
                }
            );

        // AUTO REFRESH

        setInterval(
            () => {

                this.refreshAll();

            },
            30000
        );
    }

    refreshAll() {

        try {

            dashboardManager
                ?.updateStats();

            salesManager
                ?.loadSales();

            subscriptionsManager
                ?.loadSubscriptions();

            salaryManager
                ?.loadSalaryHistory();

        } catch (error) {

            console.error(
                "Refresh error:",
                error
            );
        }
    }

    switchTab(e) {

        const tabName =
            e.target.dataset.tab;

        // remove active

        document
            .querySelectorAll(".tab-content")
            .forEach(tab => {

                tab.classList.remove(
                    "active"
                );
            });

        document
            .querySelectorAll(".nav-btn")
            .forEach(btn => {

                btn.classList.remove(
                    "active"
                );
            });

        // activate

        document
            .getElementById(tabName)
            ?.classList.add("active");

        e.target.classList.add("active");

        // refresh tab

        switch (tabName) {

            case "dashboard":

                dashboardManager
                    ?.updateStats();

                break;

            case "sales":

                salesManager
                    ?.loadSales();

                break;

            case "subscriptions":

                subscriptionsManager
                    ?.loadSubscriptions();

                break;

            case "salary":

                salaryManager
                    ?.loadSalaryHistory();

                break;
        }
    }
}
// ADD SUBSCRIPTION BUTTON

document.addEventListener(
    "click",
    async (e) => {

        if (
            e.target.id !==
            "addSubscriptionBtn"
        ) return;

        try {

            await db
                .collection("subscriptions")
                .add({

                    clientNick:
                        "Новый клиент",

                    dialogLink: "",

                    format:
                        "2/6",

                    firstPaymentDate:
                        new Date()
                            .toISOString()
                            .split("T")[0],

                    payments: {},

                    status:
                        "Активна"
                });

            subscriptionsManager
                ?.loadSubscriptions();

        } catch (error) {

            console.error(
                "Subscription add error:",
                error
            );
        }
    }
);
window.app = new App();
                                
