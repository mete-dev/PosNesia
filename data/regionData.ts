// This is a new file: data/regionData.ts
// A simplified data structure for demonstration purposes.
// A real application would fetch this from an API or a more comprehensive local database.

export const indonesiaRegions: Record<string, {
    cities: string[];
    districts: Record<string, string[]>;
    villages: Record<string, string[]>;
}> = {
    "DKI Jakarta": {
        cities: ["Jakarta Pusat", "Jakarta Selatan", "Jakarta Barat", "Jakarta Timur", "Jakarta Utara"],
        districts: {
            "Jakarta Pusat": ["Gambir", "Tanah Abang", "Menteng", "Senen", "Cempaka Putih", "Johar Baru", "Kemayoran", "Sawah Besar"],
            "Jakarta Selatan": ["Kebayoran Baru", "Tebet", "Pasar Minggu", "Cilandak", "Pesanggrahan", "Kebayoran Lama", "Setiabudi", "Mampang Prapatan", "Pancoran", "Jagakarsa"],
        },
        villages: {
            "Tanah Abang": ["Bendungan Hilir", "Karet Tengsin", "Kebon Melati", "Kebon Kacang", "Kampung Bali", "Petamburan", "Gelora"],
            "Kebayoran Baru": ["Selong", "Gunung", "Kramat Pela", "Rawa Barat", "Senayan", "Pulo", "Melawai", "Petogogan", "Cipete Utara", "Gandaria Utara"],
        },
    },
    "Jawa Barat": {
        cities: ["Bandung", "Bekasi", "Bogor", "Depok", "Cimahi"],
        districts: {
            "Bandung": ["Sumur Bandung", "Andir", "Cicendo", "Coblong", "Regol", "Astanaanyar", "Bojongloa Kaler"],
            "Bekasi": ["Bekasi Timur", "Bekasi Barat", "Bekasi Selatan", "Bekasi Utara", "Rawalumbu", "Medan Satria"],
        },
        villages: {
            "Sumur Bandung": ["Braga", "Kebon Pisang", "Merdeka", "Babakanciamis"],
            "Andir": ["Ciroyom", "Dunguscariang", "Garuda", "Maleber", "Campaka", "Kebonjeruk"],
        },
    },
     "Banten": {
        cities: ["Tangerang", "Tangerang Selatan", "Serang", "Cilegon"],
        districts: {
            "Tangerang": ["Tangerang", "Batuceper", "Benda", "Cibodas", "Ciledug", "Cipondoh"],
            "Tangerang Selatan": ["Serpong", "Pondok Aren", "Ciputat", "Pamulang"],
        },
        villages: {
            "Tangerang": ["Sukasari", "Babakan", "Buaran Indah", "Cikokol", "Kelapa Indah", "Suka Asih"],
            "Serpong": ["Buaran", "Ciater", "Cilenggang", "Lengkong Gudang", "Lengkong Wetan", "Rawa Buntu"],
        },
    },
};
