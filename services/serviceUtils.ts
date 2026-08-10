export const generateId = (prefix: string, currentLength: number): string => {
    return `${prefix}${currentLength + 1}`;
};

// --- New ID Generation Logic ---

export const getCode = (name: string, length = 3): string => {
    if (!name) return ''.padStart(length, 'X');
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, length)
        .padEnd(length, 'X');
};

export const generateBranchId = (
    cityCode: string, 
    districtCode: string, 
    cityId: string, 
    allBranches: { cityId: string }[]
): string => {
    const countInCity = allBranches.filter(b => b.cityId === cityId).length;
    const sequence = (countInCity + 1).toString().padStart(2, '0');
    return `CAB-${cityCode}${districtCode}${sequence}`;
};

export const generatePosTerminalId = (
    branchId: string, // this is the branch code
    allStations: { branchId: string }[]
): string => {
    const countInBranch = allStations.filter(s => s.branchId === branchId).length;
    const sequence = (countInBranch + 1).toString().padStart(2, '0');
    return `POS/${branchId}/${sequence}`;
};

export const generatePosSessionId = (
    stationId: string, // this is the station code
    allSummaries: { sessionId: string; date: string; cashierStationId: string }[]
): string => {
    const today = new Date();
    const yyyymmdd = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    const todaySessionsForStation = allSummaries.filter(s => {
        const sessionDate = new Date(s.date);
        const sessionYYYYMMDD = `${sessionDate.getFullYear()}${(sessionDate.getMonth() + 1).toString().padStart(2, '0')}${sessionDate.getDate().toString().padStart(2, '0')}`;
        return s.cashierStationId === stationId && sessionYYYYMMDD === yyyymmdd;
    }).length;

    const sequence = (todaySessionsForStation + 1).toString().padStart(5, '0');
    return `${stationId}/${yyyymmdd}/${sequence}`;
};

export const generatePosReceiptId = (
    sessionId: string, 
    salesInSession: { id: string, posSessionId?: string }[]
): string => {
    const countInSession = salesInSession.filter(s => s.posSessionId === sessionId).length;
    const sequence = (countInSession + 1).toString().padStart(5, '0');
    return `${sessionId}/${sequence}`;
};

export const generateAssetId = (
    assetData: { purchaseDate: string, assetCategoryId: string }, 
    allAssets: { id: string, purchaseDate: string, assetCategoryId: string }[], 
    assetCategories: { id: string, code?: string }[]
): string => {
    const date = new Date(assetData.purchaseDate);
    const yyyymmdd = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const category = assetCategories.find(c => c.id === assetData.assetCategoryId);
    const categoryCode = category?.code || 'XX';
    
    const assetsInYearForCategory = allAssets.filter(a => 
        new Date(a.purchaseDate).getFullYear() === date.getFullYear() && a.assetCategoryId === assetData.assetCategoryId
    ).length;
    
    const sequence = (assetsInYearForCategory + 1).toString().padStart(5, '0');
    return `INV/${yyyymmdd}/${categoryCode}/${sequence}`;
};

export const generateMonthlyTransactionalId = (
    prefix: string,
    branchId: string,
    date: Date,
    collection: { id: string, date?: string, orderDate?: string, requestDate?: string, billDate?: string, branchId?: string, destinationId?: string, toBranchId?: string }[]
): string => {
    const branchCode = branchId.toUpperCase();
    const yyyymm = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const countInMonthForBranch = collection.filter(item => {
        const itemDateStr = item.date || item.orderDate || item.requestDate || item.billDate;
        if (!itemDateStr) return false;
        
        const itemDate = new Date(itemDateStr);
        const itemYYYYMM = `${itemDate.getFullYear()}${(itemDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const itemBranchId = item.branchId || item.destinationId || item.toBranchId;
        
        return item.id.startsWith(prefix) && itemBranchId === branchId && itemYYYYMM === yyyymm;
    }).length;

    const sequence = (countInMonthForBranch + 1).toString().padStart(5, '0');
    return `${prefix}/${branchCode}/${yyyymm}/${sequence}`;
};

export const generateStockTransferId = (
    fromWarehouseId: string,
    toBranchId: string, // branch code
    date: Date,
    collection: { id: string, requestDate: string }[],
    warehouses: {id: string, name: string}[]
): string => {
     const fromCode = warehouses.find(w => w.id === fromWarehouseId)?.name.substring(0,3).toUpperCase() || 'XXX';
     const toCode = toBranchId.split('-')[1] || 'YYY'; // Extract from CAB-XXX...

     const yyyymm = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
     const countInMonth = collection.filter(item => {
         const itemDate = new Date(item.requestDate);
         return `${itemDate.getFullYear()}${(itemDate.getMonth() + 1).toString().padStart(2, '0')}` === yyyymm;
     }).length;
     const sequence = (countInMonth + 1).toString().padStart(5, '0');
     return `TRS/${fromCode}→${toCode}/${yyyymm}/${sequence}`;
}

export const generateCentralMonthlyId = (prefix: string, date: Date, collection: { id: string, date: string }[]): string => {
    const yyyymm = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const countInMonth = collection.filter(item => {
        const itemDate = new Date(item.date);
        return item.id.startsWith(prefix) && `${itemDate.getFullYear()}${(itemDate.getMonth() + 1).toString().padStart(2, '0')}` === yyyymm;
    }).length;
    const sequence = (countInMonth + 1).toString().padStart(5, '0');
    return `${prefix}/PST/${yyyymm}/${sequence}`; // PST for Pusat (Central)
};