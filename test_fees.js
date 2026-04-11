const groupItemsByStore = (items) => {
    if (!Array.isArray(items)) return {};
    return items.reduce((acc, item) => {
        const store = item.store || item.product?.store || item.product?.vendor?.store;
        let storeId = item.storeId || item.store_id || store?.id || store?.store_id || item.product?.store_id || item.product?.vendor_id || null;
        if (!storeId || storeId === 'null' || storeId === 'undefined') {
            storeId = 'unknown';
        } else {
            storeId = String(storeId);
        }
        if (!acc[storeId]) {
            acc[storeId] = {
                store: store || { id: storeId, name: 'Unknown Store' },
                items: []
            };
        }
        acc[storeId].items.push(item);
        return acc;
    }, {});
};

const items = [
    { id: 1, product: { store_id: 40, shipping_charge_regular: "2.5" } },
    { id: 2, product: { store_id: 42, shipping_charge_regular: "2.5" } },
    { id: 3, product: { store_id: 44, shipping_charge_regular: "2.5" } }
];

const storesGrouped = groupItemsByStore(items);
const storeIds = Object.keys(storesGrouped);

let totalDeliveryFee = 0;
const processedStores = new Set();
storeIds.forEach(storeId => {
    if (storeId === 'unknown' || processedStores.has(storeId)) return;
    processedStores.add(storeId);
    
    const storeItems = storesGrouped[storeId].items;
    const firstItem = storeItems[0];
    let shippingCharge = Number(firstItem?.product?.shipping_charge_regular) || 2.29;
    
    totalDeliveryFee += shippingCharge;
});

// specific unknown fallback check:
if (storeIds.length === 1 && storeIds[0] === 'unknown') {
    totalDeliveryFee = 2.29; // mock
}

console.log("Grouped stores length:", storeIds.length);
console.log("Total Delivery fee:", totalDeliveryFee);
