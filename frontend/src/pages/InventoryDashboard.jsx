import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { 
  Package, RefreshCw, Plus, AlertTriangle, CheckCircle2,
  Search, TrendingUp, Minus, DollarSign, Calendar, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryDashboard() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'add', 'consume'
  const [search, setSearch] = useState('');
  const [addForm, setAddForm] = useState({ item_name: '', category: 'Medicine', unit_price: '', quantity: '', threshold_limit: 50, expiry_date: '' });
  const [consumeForm, setConsumeForm] = useState({ item_id: '', quantity: 1 });

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        fetchWithAuth('/inventory-mgmt/'),
        fetchWithAuth('/inventory-mgmt/stats')
      ]);
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!addForm.item_name || !addForm.quantity || !addForm.unit_price) {
      toast.error('Item name, quantity, and price are required');
      return;
    }
    try {
      const res = await fetchWithAuth('/inventory-mgmt/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: addForm.item_name,
          category: addForm.category,
          unit_price: parseFloat(addForm.unit_price),
          quantity: parseInt(addForm.quantity),
          threshold_limit: parseInt(addForm.threshold_limit) || 50,
          expiry_date: addForm.expiry_date || null
        })
      });
      if (res.ok) {
        toast.success('Item added to inventory');
        setAddForm({ item_name: '', category: 'Medicine', unit_price: '', quantity: '', threshold_limit: 50, expiry_date: '' });
        setActiveTab('inventory');
        fetchData();
      } else {
        toast.error('Failed to add item');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleConsumeItem = async (e) => {
    e.preventDefault();
    if (!consumeForm.item_id || !consumeForm.quantity) {
      toast.error('Item ID and quantity are required');
      return;
    }
    try {
      const res = await fetchWithAuth(`/inventory-mgmt/${consumeForm.item_id}/consume?quantity=${consumeForm.quantity}`, { method: 'PUT' });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Stock consumed! Remaining: ${data.remaining}`);
        setConsumeForm({ item_id: '', quantity: 1 });
        setActiveTab('inventory');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Insufficient stock');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const filteredItems = items.filter(i => 
    !search || i.item_name?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="text-blue-600" size={28} /> Inventory & Store
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Hospital supplies, medicine stock & low-stock alerts</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Package size={12} /> Total Items</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_items}</p>
          </div>
          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={12} /> Low Stock Items</p>
            <p className="text-3xl font-black text-red-600 mt-1">{stats.low_stock_items}</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1"><DollarSign size={12} /> Total Value</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">Rs. {(stats.total_value || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'inventory', label: 'Inventory List', icon: <Package size={14} /> },
          { key: 'add', label: 'Add New Item', icon: <Plus size={14} /> },
          { key: 'consume', label: 'Consume/Issue', icon: <Minus size={14} /> }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search items by name or category..."
                className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-black text-slate-900">No Items Found</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">ID</th>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Item Name</th>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Category</th>
                    <th className="text-right px-5 py-3 font-black text-xs text-slate-500 uppercase">Qty</th>
                    <th className="text-right px-5 py-3 font-black text-xs text-slate-500 uppercase">Unit Price</th>
                    <th className="text-center px-5 py-3 font-black text-xs text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const isLow = item.quantity <= (item.threshold_limit || 50);
                    return (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-500">#{item.id}</td>
                        <td className="px-5 py-3 font-black text-slate-900">{item.item_name}</td>
                        <td className="px-5 py-3 font-medium text-slate-600">{item.category}</td>
                        <td className={`px-5 py-3 font-black text-right ${isLow ? 'text-red-600' : 'text-slate-900'}`}>{item.quantity}</td>
                        <td className="px-5 py-3 font-bold text-slate-700 text-right">Rs. {item.unit_price}</td>
                        <td className="px-5 py-3 text-center">
                          {isLow ? (
                            <span className="bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded-full text-xs font-black">Low Stock</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full text-xs font-black">In Stock</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Item Form */}
      {activeTab === 'add' && (
        <form onSubmit={handleAddItem} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Plus className="text-emerald-600" size={20} /> Add New Inventory Item
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Item Name *</label>
              <input type="text" value={addForm.item_name} onChange={e => setAddForm({...addForm, item_name: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="e.g., Paracetamol 500mg" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Category</label>
              <select value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500">
                <option>Medicine</option>
                <option>Surgical Supply</option>
                <option>PPE</option>
                <option>Lab Reagent</option>
                <option>Equipment</option>
                <option>General</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Quantity *</label>
              <input type="number" min="1" value={addForm.quantity} onChange={e => setAddForm({...addForm, quantity: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500" placeholder="100" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Unit Price (Rs.) *</label>
              <input type="number" step="0.01" value={addForm.unit_price} onChange={e => setAddForm({...addForm, unit_price: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500" placeholder="50" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Low Stock Alert At</label>
              <input type="number" min="1" value={addForm.threshold_limit} onChange={e => setAddForm({...addForm, threshold_limit: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2">
            <Plus size={16} /> Add to Inventory
          </button>
        </form>
      )}

      {/* Consume Item Form */}
      {activeTab === 'consume' && (
        <form onSubmit={handleConsumeItem} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-md">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Minus className="text-red-600" size={20} /> Consume / Issue Stock
          </h3>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Item ID *</label>
            <input type="number" value={consumeForm.item_id} onChange={e => setConsumeForm({...consumeForm, item_id: e.target.value})}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500" placeholder="Item ID from inventory list" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Quantity to Consume *</label>
            <input type="number" min="1" value={consumeForm.quantity} onChange={e => setConsumeForm({...consumeForm, quantity: parseInt(e.target.value) || 1})}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500" />
          </div>
          <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-black text-sm hover:bg-red-700 transition-all shadow-md flex items-center justify-center gap-2">
            <Minus size={16} /> Consume Stock
          </button>
        </form>
      )}
    </div>
  );
}
