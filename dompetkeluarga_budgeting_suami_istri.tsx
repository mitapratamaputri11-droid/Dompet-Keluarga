import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  collection 
} from 'firebase/firestore';
import { 
  Home, 
  PieChart as PieChartIcon, 
  Settings, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Download, 
  Copy, 
  RefreshCw, 
  Calendar,
  Sparkles,
  Wallet,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

// ============================================================================
// KONFIGURASI FIREBASE & INISIALISASI
// ============================================================================
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'dompet-keluarga-app';

// ============================================================================
// DATA DEFAULT & KONSTANTA
// ============================================================================
const EMOJI_PALETTE = [
  '💰', '💵', '💳', '🏦', '📈', '🎁', '💼', '🏪',
  '🛒', '🍲', '☕', '⚡', '💧', '📶', '🏠', '🚗',
  '⛽', '👶', '🧸', '💊', '🏥', '🎬', '✈️', '🤲',
  '👕', '📱', '🛠️', '🐾', '🎓', '🌿', '🍕', '🧺'
];

const CHART_COLORS = [
  '#F43F5E', '#3B82F6', '#F59E0B', '#8B5CF6', 
  '#10B981', '#EC4899', '#06B6D4', '#F97316', 
  '#6366F1', '#14B8A6', '#84CC16', '#64748B'
];

const DEFAULT_CATEGORIES = [
  // Pemasukan
  { id: 'inc_1', name: 'Gaji Utama', type: 'income', icon: '💰' },
  { id: 'inc_2', name: 'Bonus / THR', type: 'income', icon: '🎁' },
  { id: 'inc_3', name: 'Hasil Usaha', type: 'income', icon: '🏪' },
  { id: 'inc_4', name: 'Investasi', type: 'income', icon: '📈' },
  { id: 'inc_5', name: 'Lainnya', type: 'income', icon: '💵' },
  // Pengeluaran
  { id: 'exp_1', name: 'Belanja Dapur', type: 'expense', icon: '🛒' },
  { id: 'exp_2', name: 'Makan & Jajan', type: 'expense', icon: '🍲' },
  { id: 'exp_3', name: 'Tagihan Listrik/Air', type: 'expense', icon: '⚡' },
  { id: 'exp_4', name: 'Cicilan / KPR', type: 'expense', icon: '🏠' },
  { id: 'exp_5', name: 'Transport & Bensin', type: 'expense', icon: '⛽' },
  { id: 'exp_6', name: 'Kebutuhan Anak', type: 'expense', icon: '👶' },
  { id: 'exp_7', name: 'Kesehatan', type: 'expense', icon: '💊' },
  { id: 'exp_8', name: 'Hiburan', type: 'expense', icon: '🎬' },
  { id: 'exp_9', name: 'Sedekah / Zakat', type: 'expense', icon: '🤲' },
];

// Helper pembuat kode ruang keluarga acak
const generateRoomCode = () => {
  const words = ['BAHAGIA', 'SEJAHTERA', 'HARMONI', 'BERKAH', 'MAKMUR', 'CERIA'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `KELUARGA-${word}-${num}`;
};

// Helper pembuat data contoh bulan berjalan agar grafik langsung terlihat
const generateDummyTransactions = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const maxDay = Math.min(now.getDate(), 28);
  const d = (day) => `${year}-${month}-${String(Math.max(1, Math.min(day, maxDay))).padStart(2, '0')}`;

  return [
    {
      type: 'income',
      amount: 8500000,
      categoryId: 'inc_1',
      note: 'Gaji Bulanan Kantor',
      date: d(1),
      actor: 'Suami',
      createdAt: Date.now() - 800000
    },
    {
      type: 'income',
      amount: 5500000,
      categoryId: 'inc_1',
      note: 'Gaji Bulanan',
      date: d(1),
      actor: 'Istri',
      createdAt: Date.now() - 750000
    },
    {
      type: 'expense',
      amount: 2500000,
      categoryId: 'exp_4',
      note: 'Cicilan Rumah Bulan Ini',
      date: d(2),
      actor: 'Suami',
      createdAt: Date.now() - 700000
    },
    {
      type: 'expense',
      amount: 850000,
      categoryId: 'exp_1',
      note: 'Belanja Bulanan & Sayur',
      date: d(3),
      actor: 'Istri',
      createdAt: Date.now() - 600000
    },
    {
      type: 'expense',
      amount: 450000,
      categoryId: 'exp_3',
      note: 'Token Listrik & WiFi Rumah',
      date: d(5),
      actor: 'Suami',
      createdAt: Date.now() - 500000
    },
    {
      type: 'expense',
      amount: 600000,
      categoryId: 'exp_6',
      note: 'Susu & Popok Adik',
      date: d(7),
      actor: 'Istri',
      createdAt: Date.now() - 400000
    },
    {
      type: 'expense',
      amount: 300000,
      categoryId: 'exp_5',
      note: 'Isi Bensin Pertamax Full',
      date: d(9),
      actor: 'Suami',
      createdAt: Date.now() - 300000
    },
    {
      type: 'expense',
      amount: 225000,
      categoryId: 'exp_2',
      note: 'Makan Malam Keluarga Weekend',
      date: d(11),
      actor: 'Istri',
      createdAt: Date.now() - 200000
    },
    {
      type: 'income',
      amount: 1200000,
      categoryId: 'inc_3',
      note: 'Profit Jualan Online',
      date: d(12),
      actor: 'Istri',
      createdAt: Date.now() - 150000
    },
    {
      type: 'expense',
      amount: 350000,
      categoryId: 'exp_9',
      note: 'Sedekah Jumat & Infaq',
      date: d(14),
      actor: 'Suami',
      createdAt: Date.now() - 100000
    }
  ];
};

// ============================================================================
// FUNGSI FORMAT RUPIAH & TANGGAL
// ============================================================================
const formatRupiah = (number) => {
  const num = Number(number) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

const formatCompactRupiah = (number) => {
  const num = Number(number) || 0;
  if (num >= 1000000) return `Rp${(num / 1000000).toFixed(1).replace('.0', '')}jt`;
  if (num >= 1000) return `Rp${(num / 1000).toFixed(0)}rb`;
  return `Rp${num}`;
};

const formatNumberInput = (val) => {
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
};

const parseNumberInput = (formattedVal) => {
  return Number(String(formattedVal).replace(/\D/g, '')) || 0;
};

const formatDateIndo = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
};

const getMonthNameIndo = (monthIndex) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex];
};

// ============================================================================
// KOMPONEN UTAMA APLIKASI
// ============================================================================
export default function App() {
  // Auth & Ruang Keluarga State
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [activeActor, setActiveActor] = useState('Suami'); // 'Suami' | 'Istri'
  const [isInitializingRoom, setIsInitializingRoom] = useState(false);

  // Navigasi & Filter State
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'charts' | 'settings'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'

  // Data Real-Time dari Firestore
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modal Transaksi State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [txType, setTxType] = useState('expense');
  const [txAmountStr, setTxAmountStr] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txNote, setTxNote] = useState('');
  const [txActor, setTxActor] = useState('Suami');

  // Modal Kategori State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catType, setCatType] = useState('expense');
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🛒');

  // Modal Konfirmasi Hapus & Toast Notifikasi
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Inisialisasi Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth error:', err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !roomId) {
        // Default ke ruang demo personal otomatis berbasis UID agar langsung jalan tanpa hambatan
        const defaultRoom = `KELUARGA-${currentUser.uid.slice(0, 6).toUpperCase()}`;
        setRoomId(defaultRoom);
        setRoomInput(defaultRoom);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Sinkronisasi Real-Time Kategori & Transaksi berdasarkan Room ID
  useEffect(() => {
    if (!user || !roomId) return;

    setIsLoadingData(true);
    const sanitizedRoom = roomId.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
    if (!sanitizedRoom) return;

    // Listener untuk Metadata & Kategori Ruang Keluarga
    const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'family_rooms', sanitizedRoom);
    const unsubRoom = onSnapshot(
      roomDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.categories && Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
        } else {
          // Jika ruang baru dibuat, isi kategori default & dummy transactions agar langsung hidup
          if (!isInitializingRoom) {
            setIsInitializingRoom(true);
            try {
              await setDoc(roomDocRef, {
                createdAt: Date.now(),
                categories: DEFAULT_CATEGORIES
              });
              const txColRef = collection(db, 'artifacts', appId, 'public', 'data', `tx_${sanitizedRoom}`);
              const dummies = generateDummyTransactions();
              for (const item of dummies) {
                await addDoc(txColRef, item);
              }
            } catch (e) {
              console.error('Gagal inisialisasi ruang baru:', e);
            } finally {
              setIsInitializingRoom(false);
            }
          }
        }
      },
      (err) => {
        console.error('Error listening room doc:', err);
      }
    );

    // Listener untuk Transaksi Ruang Keluarga
    const txColRef = collection(db, 'artifacts', appId, 'public', 'data', `tx_${sanitizedRoom}`);
    const unsubTx = onSnapshot(
      txColRef,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docItem) => {
          list.push({ id: docItem.id, ...docItem.data() });
        });
        // Urutkan terbaru di atas berdasarkan tanggal lalu createdAt
        list.sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        setTransactions(list);
        setIsLoadingData(false);
      },
      (err) => {
        console.error('Error listening transactions:', err);
        setIsLoadingData(false);
      }
    );

    return () => {
      unsubRoom();
      unsubTx();
    };
  }, [user, roomId]);

  // ============================================================================
  // KALKULASI DATA & ANALITIK BULANAN
  // ============================================================================
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [categories]);

  const monthlyTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date && tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const filteredTransactions = useMemo(() => {
    return monthlyTransactions.filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catName = (categoryMap[tx.categoryId]?.name || '').toLowerCase();
        const note = (tx.note || '').toLowerCase();
        const actor = (tx.actor || '').toLowerCase();
        return catName.includes(q) || note.includes(q) || actor.includes(q);
      }
      return true;
    });
  }, [monthlyTransactions, filterType, searchQuery, categoryMap]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let husbandExpense = 0;
    let wifeExpense = 0;
    let husbandIncome = 0;
    let wifeIncome = 0;

    monthlyTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amt;
        if (tx.actor === 'Istri') wifeIncome += amt;
        else husbandIncome += amt;
      } else {
        expense += amt;
        if (tx.actor === 'Istri') wifeExpense += amt;
        else husbandExpense += amt;
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
      husbandExpense,
      wifeExpense,
      husbandIncome,
      wifeIncome
    };
  }, [monthlyTransactions]);

  // Data Pie Chart Pengeluaran per Kategori
  const expenseByCategoryData = useMemo(() => {
    const grouped = {};
    monthlyTransactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        const cat = categoryMap[tx.categoryId] || { name: 'Lainnya', icon: '📦' };
        if (!grouped[tx.categoryId]) {
          grouped[tx.categoryId] = {
            id: tx.categoryId,
            name: cat.name,
            icon: cat.icon,
            value: 0
          };
        }
        grouped[tx.categoryId].value += Number(tx.amount) || 0;
      });

    return Object.values(grouped)
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({
        ...item,
        color: CHART_COLORS[idx % CHART_COLORS.length],
        percentage: summary.expense > 0 ? ((item.value / summary.expense) * 100).toFixed(1) : 0
      }));
  }, [monthlyTransactions, categoryMap, summary.expense]);

  // Data Kurva Tren Arus Kas Harian
  const dailyTrendData = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const fullDate = `${selectedMonth}-${dayStr}`;
      days.push({
        day: dayStr,
        fullDate,
        Pemasukan: 0,
        Pengeluaran: 0
      });
    }

    monthlyTransactions.forEach((tx) => {
      const dayNum = parseInt(tx.date.split('-')[2], 10);
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        if (tx.type === 'income') {
          days[dayNum - 1].Pemasukan += Number(tx.amount) || 0;
        } else {
          days[dayNum - 1].Pengeluaran += Number(tx.amount) || 0;
        }
      }
    });

    return days;
  }, [monthlyTransactions, selectedMonth]);

  // ============================================================================
  // HANDLER AKSI TRANSAKSI & KATEGORI
  // ============================================================================
  const openAddTxModal = () => {
    setEditingTx(null);
    setTxType('expense');
    setTxAmountStr('');
    const firstExp = categories.find((c) => c.type === 'expense');
    setTxCategoryId(firstExp ? firstExp.id : '');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNote('');
    setTxActor(activeActor);
    setIsTxModalOpen(true);
  };

  const openEditTxModal = (tx) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxAmountStr(formatNumberInput(tx.amount));
    setTxCategoryId(tx.categoryId);
    setTxDate(tx.date);
    setTxNote(tx.note || '');
    setTxActor(tx.actor || 'Suami');
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const numericAmount = parseNumberInput(txAmountStr);
    if (numericAmount <= 0) {
      showToast('Masukkan nominal yang valid!', 'error');
      return;
    }
    if (!txCategoryId) {
      showToast('Pilih kategori terlebih dahulu!', 'error');
      return;
    }
    if (!user || !roomId) return;

    const sanitizedRoom = roomId.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
    const txColRef = collection(db, 'artifacts', appId, 'public', 'data', `tx_${sanitizedRoom}`);

    const payload = {
      type: txType,
      amount: numericAmount,
      categoryId: txCategoryId,
      date: txDate,
      note: txNote.trim(),
      actor: txActor,
      updatedAt: Date.now()
    };

    try {
      if (editingTx) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', `tx_${sanitizedRoom}`, editingTx.id);
        await updateDoc(docRef, payload);
        showToast('Transaksi berhasil diperbarui!');
      } else {
        await addDoc(txColRef, {
          ...payload,
          createdAt: Date.now()
        });
        showToast('Transaksi berhasil dicatat!');
      }
      setIsTxModalOpen(false);
    } catch (err) {
      console.error('Error saving tx:', err);
      showToast('Gagal menyimpan transaksi', 'error');
    }
  };

  const handleDeleteTransaction = (tx) => {
    setConfirmModal({
      open: true,
      title: 'Hapus Transaksi?',
      message: `Yakin ingin menghapus catatan "${tx.note || categoryMap[tx.categoryId]?.name || 'Transaksi'}" sebesar ${formatRupiah(tx.amount)}?`,
      onConfirm: async () => {
        try {
          const sanitizedRoom = roomId.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', `tx_${sanitizedRoom}`, tx.id));
          showToast('Transaksi dihapus');
        } catch (err) {
          showToast('Gagal menghapus transaksi', 'error');
        }
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // Handler Kategori (Tambah, Edit, Hapus)
  const openAddCategoryModal = (defaultType = 'expense') => {
    setEditingCat(null);
    setCatType(defaultType);
    setCatName('');
    setCatIcon(defaultType === 'income' ? '💰' : '🛒');
    setIsCatModalOpen(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCat(cat);
    setCatType(cat.type);
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Nama kategori tidak boleh kosong!', 'error');
      return;
    }
    if (!user || !roomId) return;

    let updatedCategories = [...categories];
    if (editingCat) {
      updatedCategories = updatedCategories.map((c) =>
        c.id === editingCat.id ? { ...c, name: catName.trim(), icon: catIcon, type: catType } : c
      );
    } else {
      const newCat = {
        id: `cat_${Date.now()}`,
        name: catName.trim(),
        icon: catIcon,
        type: catType
      };
      updatedCategories.push(newCat);
    }

    try {
      const sanitizedRoom = roomId.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
      const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'family_rooms', sanitizedRoom);
      await setDoc(roomDocRef, { categories: updatedCategories }, { merge: true });
      showToast(editingCat ? 'Kategori diperbarui!' : 'Kategori baru ditambahkan!');
      setIsCatModalOpen(false);
    } catch (err) {
      console.error('Error saving category:', err);
      showToast('Gagal menyimpan kategori', 'error');
    }
  };

  const handleDeleteCategory = (cat) => {
    const sameTypeCount = categories.filter((c) => c.type === cat.type).length;
    if (sameTypeCount <= 1) {
      showToast('Minimal harus ada 1 kategori tersisa!', 'error');
      return;
    }
    setConfirmModal({
      open: true,
      title: 'Hapus Kategori?',
      message: `Hapus kategori "${cat.icon} ${cat.name}"? Riwayat transaksi lama tetap aman tersimpan.`,
      onConfirm: async () => {
        const updatedCategories = categories.filter((c) => c.id !== cat.id);
        try {
          const sanitizedRoom = roomId.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
          const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'family_rooms', sanitizedRoom);
          await setDoc(roomDocRef, { categories: updatedCategories }, { merge: true });
          showToast('Kategori dihapus');
        } catch (err) {
          showToast('Gagal menghapus kategori', 'error');
        }
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // Handler Navigasi Bulan
  const changeMonth = (delta) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  // Handler Ganti Kode Ruang Keluarga
  const handleJoinRoom = (e) => {
    e.preventDefault();
    const cleaned = roomInput.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
    if (cleaned.length < 3) {
      showToast('Kode ruang minimal 3 karakter!', 'error');
      return;
    }
    setRoomId(cleaned);
    setRoomInput(cleaned);
    showToast(`Terhubung ke ruang: ${cleaned}`);
  };

  const handleCreateNewRoom = () => {
    const newCode = generateRoomCode();
    setRoomId(newCode);
    setRoomInput(newCode);
    showToast(`Ruang baru dibuat: ${newCode}`);
  };

  const handleCopyRoomCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomId).catch(() => {});
    }
    showToast('Kode Ruang Keluarga disalin! Bagikan ke pasangan Anda.');
  };

  // Handler Ekspor CSV
  const handleExportCSV = () => {
    if (monthlyTransactions.length === 0) {
      showToast('Tidak ada data transaksi pada bulan ini untuk diekspor', 'error');
      return;
    }
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Pencatat', 'Catatan'];
    const rows = monthlyTransactions.map((tx) => [
      tx.date,
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      `"${(categoryMap[tx.categoryId]?.name || 'Lainnya').replace(/"/g, '""')}"`,
      tx.amount,
      tx.actor || 'Suami',
      `"${(tx.note || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_${roomId}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan CSV berhasil diunduh!');
  };

  // ============================================================================
  // RENDER TAMPILAN MOBILE-FIRST
  // ============================================================================
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const currentMonthLabel = `${getMonthNameIndo(monthNum - 1)} ${yearNum}`;

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans text-slate-800 select-none">
      {/* Container Utama bergaya Layar Aplikasi Android */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl relative flex flex-col pb-24">
        
        {/* Toast Notifikasi */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-bounce">
            <div className={`px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-sm font-medium text-white ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
            }`}>
              {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* =====================================================================
            HEADER APLIKASI: IDENTITAS RUANG & PEMILIH PROFIL SUAMI / ISTRI
           ===================================================================== */}
        <header className="bg-white px-4 pt-4 pb-3 border-b border-slate-100 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base text-slate-900 leading-tight">DompetKeluarga</h1>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Ruang: {roomId || 'Memuat...'}</span>
                </button>
              </div>
            </div>

            {/* Switcher Cepat: Saya Suami / Saya Istri */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveActor('Suami')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeActor === 'Suami'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>👨🏻</span>
                <span>Suami</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveActor('Istri')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeActor === 'Istri'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>👩🏻</span>
                <span>Istri</span>
              </button>
            </div>
          </div>

          {/* Navigasi Pemilih Bulan */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-200/70">
            <button 
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 active:scale-95 transition"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentMonthLabel}</span>
            </div>
            <button 
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 active:scale-95 transition"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* =====================================================================
            KONTEN UTAMA BERDASARKAN TAB AKTIF
           ===================================================================== */}
        <main className="flex-1 px-4 pt-4 space-y-4 overflow-y-auto">
          
          {/* ------------------------- TAB 1: BERANDA ------------------------- */}
          {activeTab === 'home' && (
            <>
              {/* Kartu Saldo Utama */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300 font-medium">Sisa Saldo Bulan Ini</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 font-medium">
                    Sync Aktif
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                  {formatRupiah(summary.balance)}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                  <div className="bg-white/5 rounded-2xl p-2.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-300">Pemasukan</p>
                      <p className="text-xs sm:text-sm font-bold text-emerald-400 truncate">
                        {formatRupiah(summary.income)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-2.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-300">Pengeluaran</p>
                      <p className="text-xs sm:text-sm font-bold text-rose-400 truncate">
                        {formatRupiah(summary.expense)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter & Pencarian Riwayat */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari catatan, kategori, suami/istri..."
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {[
                      { id: 'all', label: 'Semua' },
                      { id: 'expense', label: 'Pengeluaran' },
                      { id: 'income', label: 'Pemasukan' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setFilterType(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          filterType === tab.id
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {filteredTransactions.length} transaksi
                  </span>
                </div>
              </div>

              {/* Daftar Riwayat Transaksi */}
              <div className="space-y-2.5 pb-6">
                {isLoadingData ? (
                  <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs">
                    Memuat data keluarga...
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-200">
                    <div className="text-3xl mb-2">🧾</div>
                    <p className="text-sm font-bold text-slate-700">Belum ada transaksi</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tekan tombol <span className="font-bold text-emerald-600">+</span> di bawah untuk mulai mencatat pemasukan atau pengeluaran.
                    </p>
                  </div>
                ) : (
                  filteredTransactions.map((tx) => {
                    const cat = categoryMap[tx.categoryId] || { name: 'Lainnya', icon: '📦' };
                    const isIncome = tx.type === 'income';
                    const isWife = tx.actor === 'Istri';

                    return (
                      <div
                        key={tx.id}
                        className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 active:bg-slate-50 transition"
                      >
                        {/* Ikon Kategori */}
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                          isIncome ? 'bg-emerald-50' : 'bg-rose-50'
                        }`}>
                          {cat.icon}
                        </div>

                        {/* Detail Transaksi */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-slate-800 truncate">{cat.name}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                              isWife 
                                ? 'bg-rose-100 text-rose-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {isWife ? '👩🏻 Istri' : '👨🏻 Suami'}
                            </span>
                          </div>
                          {tx.note && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">{tx.note}</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatDateIndo(tx.date)}</p>
                        </div>

                        {/* Nominal & Aksi Edit/Hapus */}
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-extrabold ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <button
                              onClick={() => openEditTxModal(tx)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              aria-label="Edit transaksi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(tx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              aria-label="Hapus transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* -------------------- TAB 2: GRAFIK & KURVA -------------------- */}
          {activeTab === 'charts' && (
            <div className="space-y-4 pb-6">
              {/* Header Laporan & Tombol Ekspor */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Analisis & Kurva</h2>
                  <p className="text-xs text-slate-500">Periode {currentMonthLabel}</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>
              </div>

              {/* Kartu Perbandingan Pengeluaran Suami vs Istri */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Kontribusi Pengeluaran Suami vs Istri</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-1">
                      <span>👨🏻</span>
                      <span>Suami</span>
                    </div>
                    <p className="text-sm font-extrabold text-blue-700">{formatRupiah(summary.husbandExpense)}</p>
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      {summary.expense > 0 ? Math.round((summary.husbandExpense / summary.expense) * 100) : 0}% dari total keluar
                    </p>
                  </div>

                  <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
                      <span>👩🏻</span>
                      <span>Istri</span>
                    </div>
                    <p className="text-sm font-extrabold text-rose-700">{formatRupiah(summary.wifeExpense)}</p>
                    <p className="text-[10px] text-rose-600 mt-0.5">
                      {summary.expense > 0 ? Math.round((summary.wifeExpense / summary.expense) * 100) : 0}% dari total keluar
                    </p>
                  </div>
                </div>

                {/* Progress Bar Perbandingan */}
                {summary.expense > 0 && (
                  <div className="w-full h-3 bg-rose-200 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-500"
                      style={{ width: `${(summary.husbandExpense / summary.expense) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Kurva Tren Arus Kas Harian (Area Chart) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Kurva Arus Kas Harian</span>
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Masuk
                    </span>
                    <span className="flex items-center gap-1 text-rose-600">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> Keluar
                    </span>
                  </div>
                </div>

                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 10, fill: '#94A3B8' }} 
                        axisLine={false} 
                        tickLine={false}
                        interval={4}
                      />
                      <YAxis 
                        tickFormatter={formatCompactRupiah} 
                        tick={{ fontSize: 10, fill: '#94A3B8' }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        formatter={(value) => formatRupiah(value)}
                        labelFormatter={(label) => `Tanggal ${label} ${currentMonthLabel}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Pemasukan" 
                        stroke="#10B981" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#gradIncome)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Pengeluaran" 
                        stroke="#F43F5E" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#gradExpense)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Diagram Lingkaran Pengeluaran per Kategori (Donut Chart) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Diagram Proporsi Pengeluaran
                </h3>

                {expenseByCategoryData.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Belum ada data pengeluaran pada bulan ini.
                  </div>
                ) : (
                  <>
                    <div className="h-52 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseByCategoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {expenseByCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => formatRupiah(value)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Total di tengah Donut */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-slate-400 font-medium">Total Keluar</span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {formatCompactRupiah(summary.expense)}
                        </span>
                      </div>
                    </div>

                    {/* Legenda Rincian Kategori */}
                    <div className="space-y-2 mt-2 pt-3 border-t border-slate-100">
                      {expenseByCategoryData.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="w-3 h-3 rounded-full shrink-0" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-base">{item.icon}</span>
                            <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="font-bold text-slate-800">{formatRupiah(item.value)}</span>
                            <span className="text-[11px] text-slate-400 ml-1.5">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* --------------- TAB 3: KATEGORI & RUANG KELUARGA --------------- */}
          {activeTab === 'settings' && (
            <div className="space-y-5 pb-8">
              
              {/* Bagian 1: Sinkronisasi Ruang Keluarga (Suami & Istri) */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-5 text-white shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-indigo-200" />
                  <h2 className="text-base font-bold">Sinkronisasi Suami & Istri</h2>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed mb-4">
                  Masukkan <strong>Kode Ruang Keluarga</strong> yang sama di HP Suami dan HP Istri agar semua catatan keuangan langsung tersinkronisasi otomatis.
                </p>

                {/* Kotak Kode Aktif */}
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 flex items-center justify-between mb-3 border border-white/20">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-indigo-200">Kode Ruang Aktif</p>
                    <p className="text-sm font-extrabold tracking-wide">{roomId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRoomCode}
                    className="px-3 py-2 bg-white text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </button>
                </div>

                {/* Form Gabung Ruang Lain */}
                <form onSubmit={handleJoinRoom} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    placeholder="Ketik kode ruang pasangan..."
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold uppercase focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition"
                  >
                    Hubungkan
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleCreateNewRoom}
                  className="w-full py-2 text-[11px] text-indigo-200 hover:text-white flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Buat Kode Ruang Keluarga Baru</span>
                </button>
              </div>

              {/* Bagian 2: Kelola Kategori Pengeluaran */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Sumber Pengeluaran</h3>
                    <p className="text-[11px] text-slate-400">Ketuk edit untuk ubah nama atau ikon</p>
                  </div>
                  <button
                    onClick={() => openAddCategoryModal('expense')}
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {categories.filter((c) => c.type === 'expense').map((cat) => (
                    <div key={cat.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-lg">
                          {cat.icon}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bagian 3: Kelola Kategori Pemasukan */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Sumber Pemasukan</h3>
                    <p className="text-[11px] text-slate-400">Gaji, bonus, usaha, dan lainnya</p>
                  </div>
                  <button
                    onClick={() => openAddCategoryModal('income')}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {categories.filter((c) => c.type === 'income').map((cat) => (
                    <div key={cat.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-lg">
                          {cat.icon}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panduan Pasang di Layar Utama Android */}
              <div className="bg-slate-200/70 rounded-2xl p-4 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Tips Penggunaan di HP Android:</span>
                </p>
                <p>
                  Buka halaman ini di browser <strong>Google Chrome</strong> Android, ketuk menu titik tiga (⋮) di pojok kanan atas, lalu pilih <strong>"Tambahkan ke Layar utama"</strong> agar menjadi ikon aplikasi mandiri di HP Anda & pasangan.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* =====================================================================
            FLOATING ACTION BUTTON (+) TAMBAH TRANSAKSI
           ===================================================================== */}
        <button
          onClick={openAddTxModal}
          className="fixed bottom-20 right-1/2 translate-x-[170px] sm:translate-x-[185px] z-30 w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center active:scale-90 transition-transform"
          aria-label="Catat Transaksi Baru"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* =====================================================================
            BOTTOM NAVIGATION BAR (KHUSUS MOBILE ANDROID)
           ===================================================================== */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
              activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] font-bold">Beranda</span>
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
              activeTab === 'charts' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <PieChartIcon className={`w-5 h-5 ${activeTab === 'charts' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] font-bold">Grafik & Kurva</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
              activeTab === 'settings' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] font-bold">Kategori & Sync</span>
          </button>
        </nav>

        {/* =====================================================================
            MODAL TAMBAH / EDIT TRANSAKSI
           ===================================================================== */}
        {isTxModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-extrabold text-slate-800">
                  {editingTx ? 'Edit Catatan Transaksi' : 'Catat Transaksi Baru'}
                </h2>
                <button
                  onClick={() => setIsTxModalOpen(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="space-y-4">
                {/* Switcher Tipe Pengeluaran / Pemasukan */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('expense');
                      const firstExp = categories.find((c) => c.type === 'expense');
                      if (firstExp) setTxCategoryId(firstExp.id);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-extrabold transition ${
                      txType === 'expense'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('income');
                      const firstInc = categories.find((c) => c.type === 'income');
                      if (firstInc) setTxCategoryId(firstInc.id);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-extrabold transition ${
                      txType === 'income'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>

                {/* Input Nominal Rupiah */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nominal (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-extrabold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={txAmountStr}
                      onChange={(e) => setTxAmountStr(formatNumberInput(e.target.value))}
                      placeholder="0"
                      autoFocus
                      className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 text-xl font-extrabold focus:outline-none ${
                        txType === 'income'
                          ? 'border-emerald-200 focus:border-emerald-500 text-emerald-700'
                          : 'border-rose-200 focus:border-rose-500 text-rose-700'
                      }`}
                    />
                  </div>
                </div>

                {/* Pilihan Kategori Berikon */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-600">Pilih Kategori</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTxModalOpen(false);
                        openAddCategoryModal(txType);
                      }}
                      className="text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      + Kategori Baru
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1">
                    {categories
                      .filter((c) => c.type === txType)
                      .map((cat) => {
                        const selected = txCategoryId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setTxCategoryId(cat.id)}
                            className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition ${
                              selected
                                ? txType === 'income'
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                                  : 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-[11px] font-bold line-clamp-1">{cat.name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Pencatat (Suami / Istri) & Tanggal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Dicatat Oleh</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setTxActor('Suami')}
                        className={`py-2 rounded-lg text-xs font-bold transition ${
                          txActor === 'Suami' ? 'bg-blue-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        👨🏻 Suami
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxActor('Istri')}
                        className={`py-2 rounded-lg text-xs font-bold transition ${
                          txActor === 'Istri' ? 'bg-rose-500 text-white' : 'text-slate-600'
                        }`}
                      >
                        👩🏻 Istri
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Catatan Singkat */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Catatan (Opsional)</label>
                  <input
                    type="text"
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    placeholder="Contoh: Belanja sayur & buah di pasar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Tombol Simpan */}
                <button
                  type="submit"
                  className={`w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-lg active:scale-98 transition ${
                    txType === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                  }`}
                >
                  {editingTx ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL TAMBAH / EDIT KATEGORI & IKON
           ===================================================================== */}
        {isCatModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-extrabold text-slate-800">
                  {editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h2>
                <button
                  onClick={() => setIsCatModalOpen(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                {/* Pilih Tipe Kategori */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCatType('expense')}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      catType === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-600'
                    }`}
                  >
                    Sumber Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatType('income')}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      catType === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Sumber Pemasukan
                  </button>
                </div>

                {/* Input Nama Kategori */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nama Kategori</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Contoh: Skincare, Arisan, Gaji Sampingan..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                {/* Pemilih Ikon Emoji */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Pilih Ikon Kategori ({catIcon})
                  </label>
                  <div className="grid grid-cols-8 gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto">
                    {EMOJI_PALETTE.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCatIcon(emoji)}
                        className={`h-9 rounded-xl text-lg flex items-center justify-center transition ${
                          catIcon === emoji
                            ? 'bg-emerald-600 text-white scale-110 shadow-sm'
                            : 'hover:bg-white'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-lg transition"
                >
                  Simpan Kategori
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL KONFIRMASI HAPUS (PENGGANTI ALERT/CONFIRM)
           ===================================================================== */}
        {confirmModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 mb-1">{confirmModal.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">{confirmModal.message}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
                  className="py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-sm"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}