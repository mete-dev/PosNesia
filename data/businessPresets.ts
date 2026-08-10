export interface ProductPreset {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  // Retail wholesale tier
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  // Stock details
  stock: number;
  shelfLocation?: string;
  // Production / Bakery fresh baked time
  freshBakedMinutesAgo?: number;
  // Modifiers
  isCustomizable?: boolean;
  // Services & Job Orders
  isService?: boolean;
  unit?: string; // 'kg', 'jam', 'unit'
  durationMinutes?: number;
  // Commission for appointment staff
  commissionPercent?: number;
}

export interface BusinessPreset {
  id: 'retail' | 'production_retail' | 'qsr' | 'fsr' | 'service_job' | 'appointment_commission';
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  primaryColor: string;
  accentColor: string;
  themeClasses: {
    bg: string;
    text: string;
    border: string;
    primaryBtn: string;
    accentBtn: string;
    cardHover: string;
    badge: string;
  };
  categories: string[];
  products: ProductPreset[];
}

export const BUSINESS_PRESETS: Record<'retail' | 'production_retail' | 'qsr' | 'fsr' | 'service_job' | 'appointment_commission', BusinessPreset> = {
  retail: {
    id: 'retail',
    title: 'POS Ritel & Toko (Retail)',
    subtitle: 'Manajemen eceran, barcode, & grosir',
    description: 'Beli barang langsung bayar instan. Cocok untuk minimarket, toko kelontong, fashion, kosmetik, dan apotek.',
    icon: 'ShoppingBag',
    primaryColor: '#1e3a8a', // Blue 900
    accentColor: '#dbeafe', // Blue 100
    themeClasses: {
      bg: 'bg-slate-50 dark:bg-slate-950',
      text: 'text-blue-950 dark:text-blue-100',
      border: 'border-blue-100 dark:border-blue-950',
      primaryBtn: 'bg-blue-700 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700',
      accentBtn: 'bg-blue-100 hover:bg-blue-200 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
      cardHover: 'hover:border-blue-400 hover:shadow-blue-100/40 dark:hover:shadow-none',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
    },
    categories: ['Semua', 'Sembako', 'Makanan Instan', 'Kebutuhan Rumah', 'Kebersihan'],
    products: [
      { id: 'r1', name: 'Minyak Goreng Sania 2L', price: 38000, category: 'Sembako', stock: 85, shelfLocation: 'Rak A-1', wholesalePrice: 35500, wholesaleMinQty: 5 },
      { id: 'r2', name: 'Beras Setra Ramos Premium 5kg', price: 72000, category: 'Sembako', stock: 40, shelfLocation: 'Rak B-2', wholesalePrice: 68000, wholesaleMinQty: 3 },
      { id: 'r3', name: 'Gula Pasir Gulaku Murni 1kg', price: 17000, category: 'Sembako', stock: 120, shelfLocation: 'Rak A-2', wholesalePrice: 15800, wholesaleMinQty: 10 },
      { id: 'r4', name: 'Indomie Goreng Original', price: 3100, category: 'Makanan Instan', stock: 450, shelfLocation: 'Rak C-1', wholesalePrice: 2850, wholesaleMinQty: 40 },
      { id: 'r5', name: 'Teh Celup Sariwangi isi 25', price: 7800, category: 'Kebutuhan Rumah', stock: 160, shelfLocation: 'Rak C-3', wholesalePrice: 7100, wholesaleMinQty: 12 },
      { id: 'r6', name: 'Susu Cair Ultra Milk UHT 1L', price: 19000, category: 'Makanan Instan', stock: 64, shelfLocation: 'Kulkas 1', wholesalePrice: 17800, wholesaleMinQty: 6 },
      { id: 'r7', name: 'Sabun Cuci Piring Sunlight 750ml', price: 15500, category: 'Kebersihan', stock: 95, shelfLocation: 'Rak D-2' },
      { id: 'r8', name: 'Tisu Wajah Paseo Soft Pack 250s', price: 21000, category: 'Kebutuhan Rumah', stock: 70, shelfLocation: 'Rak D-1' }
    ]
  },
  production_retail: {
    id: 'production_retail',
    title: 'POS Pabrikasi & Ritel (Bakery)',
    subtitle: 'Produksi backend & penjualan toko frontend',
    description: 'Manajemen stok roti/pastry hangat per batch, pelacakan spoilage (basi/rusak), & paket bundling promo.',
    icon: 'Cake',
    primaryColor: '#854d0e', // Amber 800
    accentColor: '#fef3c7', // Amber 100
    themeClasses: {
      bg: 'bg-stone-50 dark:bg-stone-950',
      text: 'text-amber-950 dark:text-amber-100',
      border: 'border-amber-200 dark:border-amber-900/50',
      primaryBtn: 'bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-600 dark:hover:bg-amber-700',
      accentBtn: 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
      cardHover: 'hover:border-amber-400 hover:shadow-amber-100/50 dark:hover:shadow-none',
      badge: 'bg-amber-100 text-amber-850 dark:bg-amber-950/80 dark:text-amber-300'
    },
    categories: ['Semua', 'Roti Manis', 'Kue & Pastry', 'Kue Ulang Tahun', 'Paket Bundling'],
    products: [
      { id: 'b1', name: 'Croissant Butter Flaky', price: 24000, category: 'Kue & Pastry', stock: 18, freshBakedMinutesAgo: 12 },
      { id: 'b2', name: 'Roti Kasur Gandum Sehat', price: 19500, category: 'Roti Manis', stock: 11, freshBakedMinutesAgo: 28 },
      { id: 'b3', name: 'Roti Sobek Choco Double Cheese', price: 28000, category: 'Roti Manis', stock: 15, freshBakedMinutesAgo: 4 },
      { id: 'b4', name: 'Kue Black Forest Custom (Ø 20cm)', price: 185000, category: 'Kue Ulang Tahun', stock: 3, isCustomizable: true },
      { id: 'b5', name: 'Donut Glazed Gula Salju (Lusin)', price: 48000, category: 'Paket Bundling', stock: 8, freshBakedMinutesAgo: 45 },
      { id: 'b6', name: 'Portuguese Egg Tart', price: 15000, category: 'Kue & Pastry', stock: 22, freshBakedMinutesAgo: 19 },
      { id: 'b7', name: 'Cheese Cake Slice Classic', price: 34000, category: 'Kue & Pastry', stock: 9 },
      { id: 'b8', name: 'Paket Sarapan Hemat (Roti + Kopi)', price: 35000, category: 'Paket Bundling', stock: 30 }
    ]
  },
  qsr: {
    id: 'qsr',
    title: 'POS Layanan Cepat (QSR)',
    subtitle: 'Pesanan bayar-dulu (Pay-First) & kustomisasi',
    description: 'Sistem kustomisasi menu (es, gula, boba), antrean instan, & pengiriman otomatis tiket cetak ke dapur/barista.',
    icon: 'Zap',
    primaryColor: '#047857', // Emerald 700
    accentColor: '#ecfdf5', // Emerald 50
    themeClasses: {
      bg: 'bg-zinc-50 dark:bg-zinc-950',
      text: 'text-emerald-950 dark:text-emerald-100',
      border: 'border-emerald-100 dark:border-emerald-950',
      primaryBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700',
      accentBtn: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
      cardHover: 'hover:border-emerald-400 hover:shadow-emerald-100/40 dark:hover:shadow-none',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
    },
    categories: ['Semua', 'Minuman Dingin', 'Minuman Hangat', 'Camilan Gurih', 'Makanan Cepat Saji'],
    products: [
      { id: 'q1', name: 'Brown Sugar Boba Fresh Milk', price: 23000, category: 'Minuman Dingin', stock: 999, isCustomizable: true },
      { id: 'q2', name: 'Premium Matcha Cream Latte', price: 26000, category: 'Minuman Dingin', stock: 999, isCustomizable: true },
      { id: 'q3', name: 'Hazelnut Caramel Cappuccino', price: 29000, category: 'Minuman Hangat', stock: 999, isCustomizable: true },
      { id: 'q4', name: 'Es Kopi Aren Signature', price: 19000, category: 'Minuman Dingin', stock: 999, isCustomizable: true },
      { id: 'q5', name: 'Crispy Chicken Burger Spicy', price: 35000, category: 'Makanan Cepat Saji', stock: 150, isCustomizable: true },
      { id: 'q6', name: 'French Fries Extra Crispy Large', price: 19000, category: 'Camilan Gurih', stock: 200 },
      { id: 'q7', name: 'Chicken Wings BBQ Sauce (6pcs)', price: 28000, category: 'Makanan Cepat Saji', stock: 120 },
      { id: 'q8', name: 'Tahu Walik Gurih Crispy', price: 16000, category: 'Camilan Gurih', stock: 180 }
    ]
  },
  fsr: {
    id: 'fsr',
    title: 'POS Restoran Layanan Penuh (FSR)',
    subtitle: 'Makan dulu bayar belakangan (Pay-Later)',
    description: 'Manajemen denah visual meja terisi/kosong, simpan open bill, dan split/merge tagihan per meja.',
    icon: 'Utensils',
    primaryColor: '#9f1239', // Rose 800
    accentColor: '#ffe4e6', // Rose 100
    themeClasses: {
      bg: 'bg-rose-50/30 dark:bg-stone-900',
      text: 'text-rose-950 dark:text-rose-100',
      border: 'border-rose-150 dark:border-rose-900/40',
      primaryBtn: 'bg-rose-700 hover:bg-rose-800 text-white dark:bg-rose-600 dark:hover:bg-rose-750',
      accentBtn: 'bg-rose-100 hover:bg-rose-200 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200',
      cardHover: 'hover:border-rose-400 hover:shadow-rose-100/30 dark:hover:shadow-none',
      badge: 'bg-rose-100 text-rose-850 dark:bg-rose-950/80 dark:text-rose-300'
    },
    categories: ['Semua', 'Makanan Utama', 'Sup & Sayur', 'Minuman Tradisional', 'Desert Penutup'],
    products: [
      { id: 'f1', name: 'Nasi Goreng Bebek Madura Cabe Ijo', price: 42000, category: 'Makanan Utama', stock: 100 },
      { id: 'f2', name: 'Iga Sapi Bakar Rica Pedas', price: 85000, category: 'Makanan Utama', stock: 50 },
      { id: 'f3', name: 'Ayam Bakar Madu Spesial Solo', price: 38000, category: 'Makanan Utama', stock: 80 },
      { id: 'f4', name: 'Sup Buntut Sapi Kuah Hangat', price: 79000, category: 'Sup & Sayur', stock: 45 },
      { id: 'f5', name: 'Cah Kangkung Terasi Hotplate', price: 22000, category: 'Sup & Sayur', stock: 120 },
      { id: 'f6', name: 'Es Campur Spesial Durian', price: 25000, category: 'Desert Penutup', stock: 60 },
      { id: 'f7', name: 'Es Jeruk Kelapa Muda Peras', price: 18000, category: 'Minuman Tradisional', stock: 200 },
      { id: 'f8', name: 'Wedang Ronde Jahe Hangat', price: 15000, category: 'Minuman Tradisional', stock: 150 }
    ]
  },
  service_job: {
    id: 'service_job',
    title: 'POS Jasa & Pesanan Kerja (Services)',
    subtitle: 'Pelacakan status pekerjaan laundry & bengkel',
    description: 'Penerimaan barang, pelacakan proses kerja, input kiloan (berat) atau durasi pengerjaan, & ambil-bayar.',
    icon: 'Wrench',
    primaryColor: '#0891b2', // Cyan 600
    accentColor: '#ecfeff', // Cyan 50
    themeClasses: {
      bg: 'bg-cyan-50/30 dark:bg-zinc-900',
      text: 'text-cyan-950 dark:text-cyan-100',
      border: 'border-cyan-150 dark:border-cyan-900/40',
      primaryBtn: 'bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-700',
      accentBtn: 'bg-cyan-100 hover:bg-cyan-200 text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-200',
      cardHover: 'hover:border-cyan-400 hover:shadow-cyan-100/30 dark:hover:shadow-none',
      badge: 'bg-cyan-100 text-cyan-850 dark:bg-cyan-950/80 dark:text-cyan-300'
    },
    categories: ['Semua', 'Laundry Kiloan', 'Laundry Satuan Specialist', 'Servis Kendaraan', 'Cuci Kendaraan'],
    products: [
      { id: 's1', name: 'Cuci Gosok Kiloan Reguler (2 Hari)', price: 8000, category: 'Laundry Kiloan', stock: 999, isService: true, unit: 'kg' },
      { id: 's2', name: 'Cuci Gosok Kiloan Express (6 Jam)', price: 15000, category: 'Laundry Kiloan', stock: 999, isService: true, unit: 'kg' },
      { id: 's3', name: 'Dry Cleaning Gaun / Wedding Dress', price: 95000, category: 'Laundry Satuan Specialist', stock: 999, isService: true, unit: 'pcs' },
      { id: 's4', name: 'Cuci Sepatu Premium Leather/Suede', price: 35000, category: 'Laundry Satuan Specialist', stock: 999, isService: true, unit: 'pasang' },
      { id: 's5', name: 'Service Motor Tune-Up Karburator', price: 75000, category: 'Servis Kendaraan', stock: 999, isService: true, unit: 'unit' },
      { id: 's6', name: 'Ganti Oli Mesin Motor Matic Shell', price: 65000, category: 'Servis Kendaraan', stock: 100, isService: false },
      { id: 's7', name: 'Cuci Mobil Hidrolik Wax Plus', price: 50000, category: 'Cuci Kendaraan', stock: 999, isService: true, unit: 'mobil' },
      { id: 's8', name: 'Cuci Motor Matic & Detailing Roda', price: 20000, category: 'Cuci Kendaraan', stock: 999, isService: true, unit: 'motor' }
    ]
  },
  appointment_commission: {
    id: 'appointment_commission',
    title: 'POS Booking & Komisi Staf (Barber & Salon)',
    subtitle: 'Manajemen terapis, stylist, booking jam, & bagi hasil',
    description: 'Booking jadwal pelanggan, pilih staf pelaksana, hitung otomatis komisi harian bagi hasil terapis/kapster.',
    icon: 'Users',
    primaryColor: '#7c3aed', // Violet 600
    accentColor: '#f5f3ff', // Violet 50
    themeClasses: {
      bg: 'bg-violet-50/20 dark:bg-neutral-900',
      text: 'text-violet-950 dark:text-violet-100',
      border: 'border-violet-150 dark:border-violet-900/30',
      primaryBtn: 'bg-violet-700 hover:bg-violet-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700',
      accentBtn: 'bg-violet-100 hover:bg-violet-200 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200',
      cardHover: 'hover:border-violet-400 hover:shadow-violet-100/30 dark:hover:shadow-none',
      badge: 'bg-violet-100 text-violet-850 dark:bg-violet-950/80 dark:text-violet-300'
    },
    categories: ['Semua', 'Grooming Pria', 'Salon Wanita', 'Perawatan Spa & Refleksi', 'Paket Combo'],
    products: [
      { id: 'a1', name: 'Premium Haircut + Wash + Tonic', price: 45000, category: 'Grooming Pria', stock: 999, isService: true, durationMinutes: 40, commissionPercent: 30 },
      { id: 'a2', name: 'Gentleman Shaving + Hot Towel', price: 25000, category: 'Grooming Pria', stock: 999, isService: true, durationMinutes: 20, commissionPercent: 25 },
      { id: 'a3', name: 'Hair Coloring Specialist / Highlight', price: 180000, category: 'Salon Wanita', stock: 999, isService: true, durationMinutes: 120, commissionPercent: 35 },
      { id: 'a4', name: 'Creambath Tradisional Lidah Buaya', price: 65000, category: 'Salon Wanita', stock: 999, isService: true, durationMinutes: 60, commissionPercent: 30 },
      { id: 'a5', name: 'Massage Tubuh Aromaterapi + Lulur', price: 120000, category: 'Perawatan Spa & Refleksi', stock: 999, isService: true, durationMinutes: 90, commissionPercent: 40 },
      { id: 'a6', name: 'Refleksi Kaki Kesehatan Tradisional', price: 60000, category: 'Perawatan Spa & Refleksi', stock: 999, isService: true, durationMinutes: 45, commissionPercent: 30 },
      { id: 'a7', name: 'Grooming & Shaving Ultimate Combo', price: 60000, category: 'Paket Combo', stock: 999, isService: true, durationMinutes: 55, commissionPercent: 30 },
      { id: 'a8', name: 'Paket Creambath + Menicure & Pedicure', price: 110000, category: 'Paket Combo', stock: 999, isService: true, durationMinutes: 100, commissionPercent: 35 }
    ]
  }
};
