/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { //calculateRevenue
   // @TODO: Расчет выручки от операции
   if (!purchase || !(typeof purchase === "object")
    ) {
        throw new Error('Чего-то не хватает');
    }
   let { discount, sale_price, quantity } = purchase;
   discount = 1 - (discount / 100);
   return sale_price * quantity * discount
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) { //calculateBonus
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    if(index === 0) {
        return profit*0.15
    } else if( index === 1 || index === 2) {
        return profit*0.1
    } else if(index === (total - 1)) {
        return 0
    } else {
        return profit*0.05
    }

}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    
    // @TODO: Проверка входных данных
    if (!data 
        ||!Array.isArray(data.customers)
        ||!Array.isArray(data.products)
        ||!Array.isArray(data.sellers)
        ||!Array.isArray(data.purchase_records)
        ||data.customers.length === 0
        ||data.products.length === 0
        ||data.sellers.length === 0
        ||data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }
    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options;
    if (!options
        || !(typeof options === "object")
        || !(typeof calculateRevenue === "function")
        || !(typeof calculateBonus === "function")
    ) {
        throw new Error('Чего-то не хватает');
    }
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id:seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    })); 

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = sellerStats.reduce((acc, seller) => {
        acc[seller.id] = seller
        return acc
    }, {})

    // const productIndex  = data.products.reduce((acc, product) => {
    //     acc[product.sku] = product
    //     return acc
    // }, {})
    // console.log("productIndex", productIndex)

    const productIndex = Object.fromEntries(data.products.map( product => { // захотел через Object.fromEntries по приколу сделать, кто запретит?
    return [product.sku, product]
    }))

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // для каждого Чека из коллекции продаж мы изменяем инфу внутри шаблона статистики продавца sellerStats
        const seller = sellerIndex[record.seller_id]; // Определяем Продавца, по его id из коллекции продавцов(по ключу чека продажи из коллеции продаж)
        // Увеличить количество продаж 
        seller.sales_count ++
        // Увеличить общую сумму выручки всех продаж
        seller.revenue += record.total_amount
        // Расчёт прибыли для каждого товара
        record.items.forEach(item => { // перебираем каждый проданный товар из коллекции продаж
            const product = productIndex[item.sku]; // Определяем Товар, по его sku из коллеции продуктов (по ключу чека продажи из коллеции продаж)
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = calculateRevenue(item, product)
            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue - cost
        // Увеличить общую накопленную прибыль (profit) у продавца  
            seller.profit += profit
            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] ++
        });
    });
    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => {
        return b.profit - a.profit
    }); 
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index, array) => {
        seller.bonus = calculateBonus(index, array.length, seller)
        seller.top_products = Object.entries(seller.products_sold)
        .map(item => {
        return {sku: item[0],
                quantity: item[1],  
        }})
        .sort ((a, b) => {
            return b.quantity - a.quantity
        })
        .splice(0, 10)
    });
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => {
        return{
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
        }
    })
}

