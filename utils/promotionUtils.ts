



import { CartItem, Promotion, Product, Customer } from '../types';

interface PromotionEngineResult {
  cartWithDiscounts: CartItem[];
  totalDiscount: number;
}

const isCustomerTargeted = (promo: Promotion, customer?: Customer): boolean => {
    const target = promo.customerTarget;
    switch (target.applyTo) {
        case 'all_customers':
            return true;
        case 'members_only':
            return !!customer;
        case 'exclude_customers':
            if (!customer) return true; // A non-customer is not in the excluded list
            return !target.excludedCustomerIds?.includes(customer.id);
        case 'birthday_customers':
        case 'new_customers':
            // Logic for these might be more complex, but for now, just requires a customer.
            return !!customer;
        default:
            return false;
    }
};

const doesCartMeetCondition = (
    cart: { product: Product; quantity: number }[],
    condition: Promotion['condition'],
    products: Product[],
): boolean => {
    const applicableItems = cart.filter(item => {
        if (condition.appliesToIds.length === 0) return true; // Applies to all products
        const product = products.find(p => p.id === item.product.id);
        if (!product) return false;

        switch (condition.applyBy) {
            case 'product':
                return condition.appliesToIds.includes(product.id);
            case 'category':
                return condition.appliesToIds.includes(product.categoryId || '');
            case 'principal':
                 return condition.appliesToIds.includes(product.principalId || '');
            case 'brand':
                 return condition.appliesToIds.includes(product.brandId || '');
            default:
                return false;
        }
    });

    if (applicableItems.length === 0) return false;

    const totalQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = applicableItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const quantityMet = condition.minProductQuantity ? totalQuantity >= condition.minProductQuantity : true;
    const valueMet = condition.minPurchaseValue ? totalValue >= condition.minPurchaseValue : true;

    return quantityMet && valueMet;
};


export const applyPromotionsToCart = (
  cart: Omit<CartItem, 'discount' | 'isFreebie'>[],
  promotions: Promotion[],
  products: Product[],
  customer?: Customer
): PromotionEngineResult => {
  let totalDiscount = 0;
  
  const now = new Date();
  const activePromotions = promotions.filter((p) => 
    p.status === 'active' && new Date(p.startDate) <= now && new Date(p.endDate) >= now && isCustomerTargeted(p, customer)
  );

  const discountPromotions = activePromotions.filter(p => p.benefit.type !== 'bogo');
  const bogoPromotions = activePromotions.filter(p => p.benefit.type === 'bogo');
  
  // Initialize discounts map
  const itemDiscounts: { [productId: string]: number } = {};
  cart.forEach(item => {
      itemDiscounts[item.product.id] = 0;
  });

  // 1. Apply Percentage/Fixed Discounts
  discountPromotions.forEach((promo) => {
      if (doesCartMeetCondition(cart, promo.condition, products)) {
          cart.forEach(item => {
              const product = products.find(p => p.id === item.product.id);
              if (!product) return;
              
              const isApplicable = 
                  promo.condition.appliesToIds.length === 0 ||
                  (promo.condition.applyBy === 'product' && promo.condition.appliesToIds.includes(product.id)) ||
                  (promo.condition.applyBy === 'category' && promo.condition.appliesToIds.includes(product.categoryId || '')) ||
                  (promo.condition.applyBy === 'principal' && promo.condition.appliesToIds.includes(product.principalId || '')) ||
                  (promo.condition.applyBy === 'brand' && promo.condition.appliesToIds.includes(product.brandId || ''));

              if (isApplicable) {
                  let currentDiscount = 0;
                  if (promo.benefit.type === 'percentage_discount') {
                      currentDiscount = item.product.price * (promo.benefit.value / 100);
                  } else if (promo.benefit.type === 'fixed_discount') {
                      // Fixed discount is per item, might need clarification on per-transaction fixed discount
                      currentDiscount = promo.benefit.value;
                  }
                  
                  // Apply the best discount for the item
                  if (currentDiscount > itemDiscounts[item.product.id]) {
                      itemDiscounts[item.product.id] = currentDiscount;
                  }
              }
          });
      }
  });

  // 2. Prepare cart with standard discounts
  let cartWithDiscounts: CartItem[] = cart.map(item => {
      const finalDiscountPerItem = Math.min(itemDiscounts[item.product.id] || 0, item.product.price);
      totalDiscount += finalDiscountPerItem * item.quantity;
      return {
          ...item,
          discount: finalDiscountPerItem,
          isFreebie: false,
      };
  });
  
  // 3. Apply BOGO Promotions
  bogoPromotions.forEach(promo => {
      if (doesCartMeetCondition(cart, promo.condition, products)) {
          const freeProduct = products.find(p => p.id === promo.benefit.freeProductId);
          if (freeProduct) {
              const freebieItem: CartItem = {
                  product: freeProduct,
                  productId: freeProduct.id,
                  productName: freeProduct.name,
                  price: freeProduct.price,
                  cost: freeProduct.cost,
                  quantity: promo.benefit.freeProductQuantity || 1,
                  discount: freeProduct.price, // 100% discount
                  isFreebie: true,
              };
              cartWithDiscounts.push(freebieItem);
              totalDiscount += freebieItem.discount * freebieItem.quantity;
          }
      }
  });


  return { cartWithDiscounts, totalDiscount };
};

export const getApplicableProductPromotion = (
    product: Product,
    promotions: Promotion[],
    customer?: Customer
): Promotion | null => {
    const now = new Date();
    const activePromotions = promotions.filter((p) =>
        p.promoCategory === 'Promosi' &&
        p.status === 'active' &&
        new Date(p.startDate) <= now &&
        new Date(p.endDate) >= now &&
        isCustomerTargeted(p, customer)
    );

    let bestPromo: Promotion | null = null;
    let maxDiscount = 0;

    for (const promo of activePromotions) {
        const isApplicable =
            promo.condition.appliesToIds.length === 0 ||
            (promo.condition.applyBy === 'product' && promo.condition.appliesToIds.includes(product.id)) ||
            (promo.condition.applyBy === 'category' && promo.condition.appliesToIds.includes(product.categoryId || '')) ||
            (promo.condition.applyBy === 'brand' && promo.condition.appliesToIds.includes(product.brandId || '')) ||
            (promo.condition.applyBy === 'principal' && promo.condition.appliesToIds.includes(product.principalId || ''));

        if (isApplicable) {
            let currentDiscount = 0;
            if (promo.benefit.discountType === 'percentage') {
                currentDiscount = product.price * (promo.benefit.value / 100);
            } else if (promo.benefit.discountType === 'nominal') {
                currentDiscount = promo.benefit.value;
            }

            if (currentDiscount > maxDiscount) {
                maxDiscount = currentDiscount;
                bestPromo = promo;
            }
        }
    }

    return bestPromo;
};