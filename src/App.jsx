import React, { useState, useEffect, useContext, createContext } from 'react';
import { db, auth } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- ICONS ---
const DashboardIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ProductIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const OrderIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const UserIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 1.803M15 21a9 9 0 00-3-5.657" /></svg>;
const LogoutIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const CloseIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const SunIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MoonIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const MenuIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>;

// --- CONTEXTS ---
const AdminAuthContext = createContext();
const AdminPageContext = createContext();
const ThemeContext = createContext();

// --- PROVIDERS ---
const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  return <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>{children}</ThemeContext.Provider>;
};

const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@luxe.com') {
        console.log('Admin authenticated:', { email: user.email, uid: user.uid });
        setAdmin({ email: user.email, name: user.displayName || 'Admin', uid: user.uid });
      } else {
        console.log('No admin user or invalid email:', user ? user.email : 'No user');
        setAdmin(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Auth state error:', error.code, error.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.email === 'admin@luxe.com') {
        console.log('Login successful for admin@luxe.com');
        setAdmin({ email: userCredential.user.email, name: userCredential.user.displayName || 'Admin', uid: userCredential.user.uid });
        return true;
      } else {
        console.log('Login failed: Unauthorized email', userCredential.user.email);
        await signOut(auth);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('Admin logged out');
      setAdmin(null);
    } catch (error) {
      console.error('Logout error:', error.code, error.message);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

const AdminPageProvider = ({ children }) => {
  const [page, setPage] = useState('dashboard');
  const navigate = (pageName) => setPage(pageName);
  return <AdminPageContext.Provider value={{ page, navigate }}>{children}</AdminPageContext.Provider>;
};

// --- ADMIN LOGIN PAGE ---
const AdminLoginPage = () => {
  const { login, loading } = useContext(AdminAuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (await login(email, password)) {
      toast.success('Logged in successfully!');
    } else {
      setError('Invalid credentials or unauthorized user. Please use admin@luxe.com.');
      toast.error('Invalid credentials or unauthorized user.');
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">LUXE</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Admin Dashboard Login</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 focus:ring-amber-700 text-gray-800 dark:text-gray-200" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 focus:ring-amber-700 text-gray-800 dark:text-gray-200" />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full px-6 py-3 bg-amber-800 text-white uppercase tracking-widest text-sm font-semibold hover:bg-amber-900 transition-colors duration-300 rounded-md">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

// --- DASHBOARD COMPONENTS ---
const Sidebar = () => {
  const { page, navigate } = useContext(AdminPageContext);
  const { logout } = useContext(AdminAuthContext);
  const navItems = [
    { name: 'dashboard', icon: DashboardIcon, label: 'Dashboard' },
    { name: 'products', icon: ProductIcon, label: 'Products' },
    { name: 'orders', icon: OrderIcon, label: 'Orders' },
    { name: 'users', icon: UserIcon, label: 'Users' },
    { name: 'categories', icon: ProductIcon, label: 'Categories' }
  ];
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
      <div className="p-6 text-center">
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">LUXE</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">ADMIN PANEL</p>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-2">
        {navItems.map(item => (
          <button key={item.name} onClick={() => navigate(item.name)} className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${page === item.name ? 'bg-amber-700 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <item.icon className="h-5 w-5 mr-3" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button onClick={logout} className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
          <LogoutIcon className="h-5 w-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const DashboardHeader = () => {
  const { page } = useContext(AdminPageContext);
  const { admin } = useContext(AdminAuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden mr-4 text-gray-600 dark:text-gray-300 hover:text-amber-800 dark:hover:text-amber-600">
          <MenuIcon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white capitalize">{page}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="text-gray-600 dark:text-gray-300 hover:text-amber-800 dark:hover:text-amber-600">
          {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-300">Welcome, {admin?.name}</span>
      </div>
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <div className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-amber-800 dark:hover:text-amber-600">
              <CloseIcon className="h-6 w-6" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}
    </header>
  );
};

const DashboardHomePage = () => {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, users: 0 });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const newErrors = [];
      const statsData = { revenue: 0, orders: 0, products: 0, users: 0 };

      // Fetch products
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        statsData.products = productsSnapshot.size;
        console.log('Products fetched for stats:', statsData.products);
      } catch (error) {
        console.error('Error fetching products for stats:', error.code, error.message);
        newErrors.push(`Products: ${error.message}`);
      }

      // Fetch orders
      try {
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        statsData.orders = ordersSnapshot.size;
        statsData.revenue = ordersSnapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
        console.log('Orders fetched for stats:', statsData.orders, 'Revenue:', statsData.revenue);
      } catch (error) {
        console.error('Error fetching orders for stats:', error.code, error.message);
        newErrors.push(`Orders: ${error.message}`);
      }

      // Fetch users
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        statsData.users = usersSnapshot.size;
        console.log('Users fetched for stats:', statsData.users);
      } catch (error) {
        console.error('Error fetching users for stats:', error.code, error.message);
        newErrors.push(`Users: ${error.message}`);
      }

      setStats(statsData);
      setErrors(newErrors);
      setLoading(false);

      if (newErrors.length > 0) {
        toast.warn('Some dashboard stats could not be loaded.');
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-800 dark:text-gray-200">Loading stats...</div>;

  return (
    <div className="p-6">
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
          <p className="font-semibold">Errors loading stats:</p>
          <ul className="list-disc pl-5">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Total Revenue</h3>
          <p className="text-3xl font-bold">PKR {stats.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Total Orders</h3>
          <p className="text-3xl font-bold">{stats.orders}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Total Products</h3>
          <p className="text-3xl font-bold">{stats.products}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Total Users</h3>
          <p className="text-3xl font-bold">{stats.users}</p>
        </div>
      </div>
    </div>
  );
};

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Products fetched:', productList);
      setProducts(productList);
    }, (error) => {
      console.error('Error fetching products:', error.code, error.message);
      toast.error('Failed to load products.');
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (productData) => {
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success('Product updated successfully!');
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success('Product added successfully!');
      }
      setShowModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error.code, error.message);
      toast.error('Failed to save product.');
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        toast.success('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error.code, error.message);
        toast.error('Failed to delete product.');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Product Management</h2>
        <button onClick={() => { setEditingProduct(null); setShowModal(true); }} className="px-4 py-2 bg-amber-800 text-white rounded-md hover:bg-amber-900">Add Product</button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="text-left font-bold bg-gray-50 dark:bg-gray-700">
              <th className="p-4">Image</th><th className="p-4">Name</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {products.map(p => (
              <tr key={p.id}>
                <td className="p-4">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-10 w-10 rounded-md object-cover"/>
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500">No Image</div>
                  )}
                </td>
                <td className="p-4">{p.name}</td><td className="p-4">{p.category}</td><th className="p-4">PKR {p.price.toLocaleString()}</th><td className="p-4">{p.stock}</td>
                <td className="p-4 space-x-2">
                  <button onClick={() => { setEditingProduct(p); setShowModal(true); }} className="text-blue-500 hover:text-blue-700">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && <ProductFormModal product={editingProduct} onSave={handleSave} onClose={() => setShowModal(false)} />}
    </div>
  );
};

const ProductFormModal = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState(product || {
    name: '',
    category: '',
    price: '',
    stock: '',
    sizes: [],
    description: '',
    details: [],
    image: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoryList = querySnapshot.docs.map(doc => doc.data().name);
        console.log('Fetched categories for product form:', categoryList);
        setCategories(categoryList);
      } catch (error) {
        console.error('Error fetching categories for product form:', error.code, error.message);
        toast.error('Failed to load categories for product form.');
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sizes' || name === 'details') {
      setFormData({ ...formData, [name]: value.split(',').map(item => item.trim()).filter(Boolean) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setFormData({ ...formData, image: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const uploadImageToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      console.log('Uploading image to ImgBB...');
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      console.log('ImgBB response:', data);
      if (data.success) {
        return data.data.url;
      } else {
        throw new Error(data.error?.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Error uploading image to ImgBB:', error.message);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!formData.name || !formData.category || !formData.price || !formData.stock || (!formData.image && !imageFile)) {
      setError('All required fields (name, category, price, stock, image) must be filled.');
      toast.error('All required fields must be filled.');
      setLoading(false);
      return;
    }
    if (parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0.');
      toast.error('Price must be greater than 0.');
      setLoading(false);
      return;
    }
    if (parseInt(formData.stock) < 0) {
      setError('Stock cannot be negative.');
      toast.error('Stock cannot be negative.');
      setLoading(false);
      return;
    }
    try {
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadImageToImgBB(imageFile);
      }
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        image: imageUrl,
        createdAt: new Date().toISOString()
      };
      console.log('Saving product:', productData);
      await onSave(productData);
      setLoading(false);
    } catch (error) {
      setError(`Failed to save product: ${error.message}`);
      toast.error(`Failed to save product: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{product ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} disabled={loading}><CloseIcon className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" required disabled={loading} className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 focus:ring-amber-700 text-gray-800 dark:text-gray-200" />
          <select name="category" value={formData.category} onChange={handleChange} required disabled={loading} className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 focus:ring-amber-700 text-gray-800 dark:text-gray-200">
            <option value="">Select Category</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            <option value="custom">Custom Category</option>
          </select>
          {formData.category === 'custom' && (
            <input name="customCategory" onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Enter Custom Category" disabled={loading} className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 focus:ring-amber-700 text-gray-800 dark:text-gray-200" />
          )}
          <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price (PKR)" required disabled={loading} className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 focus:ring-amber-700 text-gray-800 dark:text-gray-200" />
          <input name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="Stock" required disabled={loading} className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 focus:ring-amber-700 text-gray-800 dark:text-gray-200" />
          <input name="sizes" value={formData.sizes.join(', ')} onChange={handleChange} placeholder="Sizes (comma-separated, e.g., S, M, L)" disabled={loading} className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 focus:ring-amber-700 text-gray-800 dark:text-gray-200" />
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" disabled={loading} className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 focus:ring-amber-700 text-gray-800 dark:text-gray-200" />
          <input name="details" value={formData.details.join(', ')} onChange={handleChange} placeholder="Details (comma-separated)" disabled={loading} className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 focus:ring-amber-700 text-gray-800 dark:text-gray-200" />
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Product Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={loading} className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 text-gray-800 dark:text-gray-200" />
            {formData.image ? (
              <img src={formData.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-md"/>
            ) : (
              <div className="mt-2 h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500">No Image</div>
            )}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200">Cancel</button>
            <button type="submit" disabled={loading} className={`px-4 py-2 bg-amber-800 text-white rounded-md hover:bg-amber-900 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CategoryManagement = () => {
  const { admin } = useContext(AdminAuthContext);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Fetching categories, admin:', admin);
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const categoryList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Categories fetched:', categoryList);
      setCategories(categoryList);
      setLoading(false);
      setError('');
    }, (error) => {
      console.error('Error fetching categories:', error.code, error.message);
      setError(`Failed to load categories: ${error.message}`);
      setLoading(false);
      toast.error(`Failed to load categories: ${error.message}`);
    });
    return () => unsubscribe();
  }, [admin]);

  const handleSave = async (categoryData) => {
    try {
      console.log('Saving category:', categoryData, 'by admin:', admin);
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryData);
        toast.success('Category updated successfully!');
      } else {
        await addDoc(collection(db, 'categories'), categoryData);
        toast.success('Category added successfully!');
      }
      setShowModal(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error.code, error.message);
      toast.error(`Failed to save category: ${error.message}`);
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        console.log('Deleting category:', categoryId);
        await deleteDoc(doc(db, 'categories', categoryId));
        toast.success('Category deleted successfully!');
      } catch (error) {
        console.error('Error deleting category:', error.code, error.message);
        toast.error(`Failed to delete category: ${error.message}`);
      }
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-800 dark:text-gray-200">Loading categories...</div>;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Category Management</h2>
        <button onClick={() => { setEditingCategory(null); setShowModal(true); }} className="px-4 py-2 bg-amber-800 text-white rounded-md hover:bg-amber-900">Add Category</button>
      </div>
      {categories.length === 0 ? (
        <div className="text-center py-20 text-gray-600 dark:text-gray-400">No categories found. Add a category to get started.</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left font-bold bg-gray-50 dark:bg-gray-700">
                <th className="p-4">Image</th>
                <th className="p-4">Name</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map(c => (
                <tr key={c.id}>
                  <td className="p-4">
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="h-10 w-10 rounded-md object-cover"/>
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500">No Image</div>
                    )}
                  </td>
                  <td className="p-4">{c.name}</td>
                  <td className="p-4 space-x-2">
                    <button onClick={() => { setEditingCategory(c); setShowModal(true); }} className="text-blue-500 hover:text-blue-700">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <CategoryFormModal category={editingCategory} onSave={handleSave} onClose={() => setShowModal(false)} />}
    </div>
  );
};

const CategoryFormModal = ({ category, onSave, onClose }) => {
  const [formData, setFormData] = useState(category || { name: '', image: '' });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setFormData({ ...formData, image: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const uploadImageToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      console.log('Uploading category image to ImgBB...');
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      console.log('ImgBB response:', data);
      if (data.success) {
        return data.data.url;
      } else {
        throw new Error(data.error?.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Error uploading image to ImgBB:', error.message);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!formData.name || (!formData.image && !imageFile)) {
      setError('Name and image are required.');
      toast.error('Name and image are required.');
      setLoading(false);
      return;
    }
    try {
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadImageToImgBB(imageFile);
      }
      const categoryData = { ...formData, image: imageUrl };
      console.log('Submitting category:', categoryData);
      await onSave(categoryData);
      setLoading(false);
    } catch (error) {
      setError(`Failed to save category: ${error.message}`);
      toast.error(`Failed to save category: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{category ? 'Edit Category' : 'Add Category'}</h3>
          <button onClick={onClose} disabled={loading}><CloseIcon className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Category Name"
            required
            disabled={loading}
            className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 focus:ring-amber-700 text-gray-800 dark:text-gray-200"
          />
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Category Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
              className="w-full p-3 border rounded-md bg-transparent dark:border-gray-700 text-gray-800 dark:text-gray-200"
            />
            {formData.image ? (
              <img src={formData.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-md"/>
            ) : (
              <div className="mt-2 h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500">No Image</div>
            )}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-amber-800 text-white rounded-md hover:bg-amber-900 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const orderStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Orders fetched:', orderList);
      setOrders(orderList);
    }, (error) => {
      console.error('Error fetching orders:', error.code, error.message);
      toast.error('Failed to load orders.');
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      console.log('Updating order status:', orderId, newStatus);
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      const order = orders.find(o => o.id === orderId);
      if (order.customerEmail) {
        const q = query(collection(db, 'users'), where('email', '==', order.customerEmail));
        const userSnapshot = await getDocs(q);
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await updateDoc(doc(db, `users/${userDoc.id}/orders`, orderId), { status: newStatus });
        }
      }
      toast.success('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating order status:', error.code, error.message);
      toast.error('Failed to update order status.');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Order Management</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left font-bold bg-gray-50 dark:bg-gray-700">
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Date</th>
              <th className="p-4">Items</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map(o => (
              <tr key={o.id}>
                <td className="p-4">{o.id}</td>
                <td className="p-4">{o.customerEmail}</td>
                <td className="p-4">{o.date?.split('T')[0] || 'N/A'}</td>
                <td className="p-4">
                  {o.items && o.items.length > 0
                    ? o.items.map(item => item.name).join(', ')
                    : 'No items'}
                </td>
                <td className="p-4">PKR {(o.total || 0).toLocaleString()}</td>
                <td className="p-4">
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    className="p-2 border rounded-md bg-transparent dark:border-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    {orderStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => setSelectedOrder(o)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

const UserManagement = () => {
  const { admin } = useContext(AdminAuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Fetching users, admin:', admin);
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Users fetched:', userList);
      setUsers(userList);
      setLoading(false);
      setError('');
    }, (error) => {
      console.error('Error fetching users:', error.code, error.message);
      setError(`Failed to load users: ${error.message}`);
      setLoading(false);
      toast.error(`Failed to load users: ${error.message}`);
    });
    return () => unsubscribe();
  }, [admin]);

  if (loading) return <div className="text-center py-20 text-gray-800 dark:text-gray-200">Loading users...</div>;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">User Management</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left font-bold bg-gray-50 dark:bg-gray-700">
              <th className="p-4">User ID</th><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(u => (
              <tr key={u.id}>
                <td className="p-4">{u.id}</td>
                <td className="p-4">{u.name}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">{u.joined || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- DASHBOARD LAYOUT ---
const DashboardLayout = () => {
  const { page } = useContext(AdminPageContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardHomePage />;
      case 'products': return <ProductManagement />;
      case 'orders': return <OrderManagement />;
      case 'users': return <UserManagement />;
      case 'categories': return <CategoryManagement />;
      default: return <DashboardHomePage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Sidebar for larger screens */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <div className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-amber-800 dark:hover:text-amber-600">
              <CloseIcon className="h-6 w-6" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const { isAuthenticated, loading } = useContext(AdminAuthContext);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  return (
    <AdminPageProvider>
      <DashboardLayout />
    </AdminPageProvider>
  );
}

// --- ROOT COMPONENT ---
function Root() {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <App />
        <ToastContainer />
      </AdminAuthProvider>
    </ThemeProvider>
  );
}

export { Root };