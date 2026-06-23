import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Home, 
  CreditCard, 
  MessageSquare, 
  Plus, 
  Receipt
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../database/supabaseClient';

const DashboardApp = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('homestead');

  const [homesteads, setHomesteads] = useState([]);
  const [payments, setPayments] = useState([]);

  // SMS State
  const [smsMessage, setSmsMessage] = useState('');
  const [smsRecipientType, setSmsRecipientType] = useState('bulk');
  const [bulkTarget, setBulkTarget] = useState('all'); // 'all', 'paid', 'pending'
  const [selectedIndividual, setSelectedIndividual] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Homestead Form State
  const [newHomestead, setNewHomestead] = useState({
    owner: '',
    address: '',
    area: '',
    zone: '',
    phone: '',
    gps: '',
    status: 'Pending'
  });

  // Payment Form State
  const [newPayment, setNewPayment] = useState({
    payee: '',
    amount: '',
    method: ''
  });

  const paymentMethods = ['MTN MoMo', 'e-Mali', 'e-wallet', 'Unayo', 'InstaCash', 'ETF'];
  const areas = ['Ezulwini', 'Shiselweni', 'Hhohho', 'Lubombo'];
  const zones = ['Gelekeceni', 'Nyonyane', 'Zone C', 'Zone D'];

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Homesteads', icon: Home },
    { name: 'Payments', icon: CreditCard },
    { name: 'SMS', icon: MessageSquare },
  ];

  const kpis = [
    { label: 'Total Homesteads', value: '12,458', color: 'bg-slate-800 border border-slate-700' },
    { label: 'Paid', value: '4,872 (39%)', color: 'bg-emerald-900 border border-emerald-700' },
    { label: 'Revenue', value: 'E248,650', color: 'bg-slate-800 border border-slate-700' },
    { label: 'Pending SMS', value: '1,284', color: 'bg-amber-900 border border-amber-700', notification: 12 },
  ];

  useEffect(() => {
    fetchData();
  }, []);
 
  // Fetch all homestead records
  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('homesteads')
        .select('*')
        .order('created_at', { ascending: false }); // Newest first

      if (error) {
        console.error('Error fetching homesteads:', error);
        toast.error('Failed to load homesteads');
        return;
      }

      setHomesteads(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong while loading data');
    }
  };
    

  // Get GPS Location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setNewHomestead(prev => ({
            ...prev,
            gps: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
          toast.success('GPS coordinates captured successfully!');
        },
        () => toast.error("Unable to retrieve location. Please enable GPS.")
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const handleHomesteadChange = (e) => {
    const { name, value } = e.target;
    setNewHomestead(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({ ...prev, [name]: value }));
  };


  const handleAddHomestead = async () => {
    /*if (!newHomestead.owner || !newHomestead.address || !newHomestead.phone) {
      toast.error("Owner Name, Address, and Phone Number are required");
      return;
    }*/

    const homesteadToAdd = {
      id: Date.now(),
      ...newHomestead,
      paidTotal: 0,
      outstanding: 240,
    };

    try {
      const { data, error } = await supabase
      .from('homesteads')
      .insert([
        homesteadToAdd
      ])
      .select();

      if (error) throw error;

      console.log("Record inserted successfully:", data);
      toast.success("Sample homestead record created!");
   
    
    } catch (error) {
      console.error(error);
      toast.error("Failed to insert record: " + error.message);
    }

    //setHomesteads(prev => [homesteadToAdd, ...prev]);
    fetchData();
    setShowModal(false);
  };

  const handleAddPayment = () => {
    if (!newPayment.payee || !newPayment.amount || !newPayment.method) {
      toast.error("Please fill all payment fields");
      return;
    }

    const amount = parseFloat(newPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    const homesteadIndex = homesteads.findIndex(h => h.owner === newPayment.payee);
    if (homesteadIndex === -1) {
      toast.error("Homestead owner not found");
      return;
    }

    const homestead = homesteads[homesteadIndex];
    const newPaidTotal = homestead.paidTotal + amount;
    const newOutstanding = Math.max(0, 240 - newPaidTotal);

    if (newPaidTotal > 240) {
      toast.error(`Payment exceeds outstanding balance of E${homestead.outstanding}`);
      return;
    }

    const updatedHomesteads = [...homesteads];
    updatedHomesteads[homesteadIndex] = {
      ...homestead,
      paidTotal: newPaidTotal,
      outstanding: newOutstanding,
      status: newOutstanding <= 0 ? 'Paid' : 'Partial'
    };

    setHomesteads(updatedHomesteads);

    const paymentToAdd = {
      id: Date.now(),
      ...newPayment,
      amount,
      date: new Date().toLocaleDateString(),
      status: 'Paid'
    };

    setPayments(prev => [paymentToAdd, ...prev]);
    setShowModal(false);
    setNewPayment({ payee: '', amount: '', method: '' });

    toast.success(`Payment recorded! New outstanding: E${newOutstanding}`);
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const formatCurrency = (amount) => `E${parseFloat(amount || 0).toFixed(2)}`;

  // Mock TfumelaBulkMessaging Sender
  const sendSmsViaTfumela = async (phone, message) => {
    // Using fetch API
    const response = await fetch("https://app.tfumela.com/api/send", {
      method: "POST",
      headers: {
          "Authorization": "Bearer 27|qiMuOvTItIZH7tJRhc2JIhCTNT0tZTlnDAOnHMcNbe385d0e",
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          operation: "send_message",
          message_type: "direct",
          message_content: message,
          recipient: phone,
      })
    });
    const data = await response.json();
    return true;
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSending(true);

    try {
      let recipients = [];

      if (smsRecipientType === 'bulk') {
        recipients = homesteads.filter(h => h.phone).filter(h => {
          if (bulkTarget === 'all') return true;
          if (bulkTarget === 'paid') return h.status === 'Paid';
          if (bulkTarget === 'pending') return h.status === 'Pending' || h.status === 'Partial';
          return true;
        });
      } else {
        const selected = homesteads.find(h => h.owner === selectedIndividual);
        if (selected && selected.phone) recipients = [selected];
      }

      if (recipients.length === 0) {
        toast.error("No recipients found with phone numbers");
        setIsSending(false);
        return;
      }

      for (const recipient of recipients) {
        // Personalize message with owner name
        let personalizedMsg = smsMessage.replace(/{name}/gi, recipient.owner);
        await sendSmsViaTfumela(recipient.phone, personalizedMsg);
      }

      toast.success(`Personalized SMS sent successfully to ${recipients.length} recipient(s)!`);
      setSmsMessage('');
      setSelectedIndividual('');
    } catch (error) {
      toast.error("Failed to send one or more SMS");
    } finally {
      setIsSending(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <>
            <div className="flex items-center justify-between mb-8 mt-23">
              <h2 className="text-3xl font-semibold text-white">Dashboard</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
              {kpis.map((kpi, index) => (
                <div key={index} className={`rounded-3xl p-6 ${kpi.color} transition-all hover:scale-[1.02]`}>
                  <p className="text-slate-400 text-sm font-medium">{kpi.label}</p>
                  <p className="text-3xl font-semibold mt-3 tracking-tighter text-white">{kpi.value}</p>
                  {kpi.notification && (
                    <div className="mt-4 inline-flex items-center bg-amber-500 text-amber-950 text-xs font-semibold px-3 py-1 rounded-2xl">
                      {kpi.notification} pending
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Other dashboard sections remain the same */}
            <div className="bg-slate-900 rounded-3xl p-6 mb-10 border border-slate-800">
              <div className="flex justify-between mb-6">
                <h3 className="font-semibold text-lg">Payment Trends • Last 30 Days</h3>
                <span className="text-xs text-emerald-400 font-mono">↑ 14% from last month</span>
              </div>
              <div className="h-52 flex items-end gap-3">
                {[42, 55, 48, 67, 72, 81, 76, 89, 85, 94].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col-reverse">
                    <div className="bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-xl w-full" style={{ height: `${height}%` }}></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <h3 className="font-semibold text-lg mb-5">Performance by Region</h3>
              <div className="space-y-6">
                {areas.map((area, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-28 font-medium text-slate-300">{area}</div>
                    <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-2.5 rounded-full bg-emerald-600" style={{ width: `${60 - i * 8}%` }}></div>
                    </div>
                    <div className="w-14 text-right font-semibold text-emerald-400">{60 - i * 8}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pb-4">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-lg">Recent Homesteads</h3>
                <button className="text-emerald-400 hover:text-emerald-300 text-sm">View All →</button>
              </div>
              <div className="space-y-4">
                {homesteads.slice(0, 3).map((home) => (
                  <div key={home.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">{home.owner}</p>
                      <p className="text-slate-400 text-sm">{home.area} • {home.zone}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-5 py-2 text-sm font-semibold rounded-2xl text-white bg-emerald-600">Added</span>
                      <p className="text-xs text-slate-400 mt-1">Out: {formatCurrency(home.outstanding)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'Homesteads':
        return (
          <div className="py-8 mt-23">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-semibold text-white">Homesteads</h2>
              <button onClick={() => openModal('homestead')} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-medium flex items-center gap-2">
                <Plus size={20} /> Add New
              </button>
            </div>

            {homesteads.length === 0 ? (
              <div className="text-center py-20">
                <Home size={64} className="mx-auto text-slate-500 mb-6" />
                <p className="text-slate-400">No homesteads added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {homesteads.map((home) => (
                  <div key={home.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-lg text-white">{home.owner}</p>
                        <p className="text-slate-400">{home.address}</p>
                      </div>
                      <span className="text-emerald-400 text-sm font-medium">{home.dateAdded}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-slate-500">Area:</span> {home.area}</div>
                      <div><span className="text-slate-500">Zone:</span> {home.zone}</div>
                      <div><span className="text-slate-500">Phone:</span> {home.phone}</div>
                      <div><span className="text-slate-500">GPS:</span> {home.gps || 'N/A'}</div>
                      <div><span className="text-slate-500">Paid Total:</span> <span className="font-medium text-emerald-400">{formatCurrency(home.paidTotal)}</span></div>
                      <div><span className="text-slate-500">Outstanding:</span> <span className="font-medium text-amber-400">{formatCurrency(home.outstanding)}</span></div>
                      <div><span className="text-slate-500">Status:</span> 
                        <span className={`ml-1 font-medium ${home.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>{home.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'Payments':
        return (
          <div className="py-8 mt-23">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-semibold text-white">Payments</h2>
              <button onClick={() => openModal('payment')} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-medium flex items-center gap-2">
                <Plus size={20} /> Add Payment
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-20">
                <CreditCard size={64} className="mx-auto text-slate-500 mb-6" />
                <p className="text-slate-400">No payment records yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg text-white">{payment.payee}</p>
                        <p className="text-emerald-400 text-2xl font-medium">E{payment.amount}</p>
                      </div>
                      <span className="text-xs bg-emerald-600 px-3 py-1 rounded-full">{payment.date}</span>
                    </div>
                    <div className="mt-4 flex justify-between text-sm">
                      <span className="text-slate-400">Method: <span className="text-white font-medium">{payment.method}</span></span>
                      <span className="text-emerald-500 font-medium">✓ Confirmed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'SMS':
        return (
          <div className="py-8 mt-23">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-semibold text-white">SMS Campaigns</h2>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">Recipient Type</label>
                <div className="flex gap-3">
                  <button onClick={() => setSmsRecipientType('bulk')} className={`flex-1 py-3 rounded-2xl font-medium ${smsRecipientType === 'bulk' ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
                    Bulk
                  </button>
                  <button onClick={() => setSmsRecipientType('individual')} className={`flex-1 py-3 rounded-2xl font-medium ${smsRecipientType === 'individual' ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
                    Individual
                  </button>
                </div>
              </div>

              {smsRecipientType === 'bulk' && (
                <div className="mb-6">
                  <label className="block text-sm text-slate-400 mb-2">Target Group</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setBulkTarget('all')} className={`py-3 rounded-2xl text-sm font-medium ${bulkTarget === 'all' ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'}`}>All</button>
                    <button onClick={() => setBulkTarget('paid')} className={`py-3 rounded-2xl text-sm font-medium ${bulkTarget === 'paid' ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'}`}>Paid</button>
                    <button onClick={() => setBulkTarget('pending')} className={`py-3 rounded-2xl text-sm font-medium ${bulkTarget === 'pending' ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'}`}>Pending</button>
                  </div>
                </div>
              )}

              {smsRecipientType === 'individual' && (
                <div className="mb-6">
                  <label className="block text-sm text-slate-400 mb-2">Select Owner</label>
                  <select value={selectedIndividual} onChange={(e) => setSelectedIndividual(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white">
                    <option value="">Select Homestead Owner</option>
                    {homesteads.map(h => (
                      <option key={h.id} value={h.owner}>{h.owner} — {h.phone || 'No phone'}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">Message <span className="text-emerald-400">(use {'{name}'} for personalization)</span></label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-3xl px-4 py-4 text-white h-32 resize-y min-h-[120px]"
                  placeholder="Dear {name}, your payment of E240 is now due. Please pay at your earliest convenience. Thank you!"
                  maxLength={160}
                />
                <p className="text-xs text-slate-500 mt-1 text-right">{smsMessage.length}/160</p>
              </div>

              <button
                onClick={handleSendSMS}
                disabled={isSending || !smsMessage.trim() || (smsRecipientType === 'individual' && !selectedIndividual)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 rounded-2xl font-semibold flex items-center justify-center gap-2"
              >
                {isSending ? 'Sending via TfumelaBulkMessaging...' : `Send via TfumelaBulkMessaging (${smsRecipientType === 'bulk' ? 'Bulk' : 'Individual'})`}
              </button>

              <p className="text-center text-xs text-slate-500 mt-4">Powered by Tfumela Bulk Messaging • Eswatini</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      {/* Header */}
      <div className="flex fixed top-0 left-0 right-0 items-center justify-between px-5 py-6 bg-slate-900 border-b border-slate-800 z-50">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Land Vault</h1>
          <p className="text-slate-400 text-sm">Management System</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <p className="font-medium text-slate-100">Field Supervisor</p>
            <p className="text-emerald-400 text-xs">Online</p>
          </div>
          <div className="w-9 h-9 bg-slate-700 rounded-full overflow-hidden ring-2 ring-emerald-500/30">
            <img src="https://i.pravatar.cc/150?u=supervisor" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 pt-8 max-w-2xl mx-auto">
        {renderContent()}
      </div>

      {/* Modal (unchanged) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">
                {modalType === 'homestead' ? 'Add New Homestead' : 'Add Payment Record'}
              </h2>

              {modalType === 'homestead' ? (
                <div className="space-y-5">
                  {/* Homestead form fields - unchanged */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Home Owner Name</label>
                    <input type="text" name="owner" value={newHomestead.owner} onChange={handleHomesteadChange} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white" placeholder="Enter owner name" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Home Address</label>
                    <textarea name="address" value={newHomestead.address} onChange={handleHomesteadChange} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white h-20" placeholder="Enter physical address" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Area</label>
                      <select name="area" value={newHomestead.area} onChange={handleHomesteadChange} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white">
                        <option value="">Select Area</option>
                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Zone</label>
                      <select name="zone" value={newHomestead.zone} onChange={handleHomesteadChange} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white">
                        <option value="">Select Zone</option>
                        {zones.map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
                    <input type="tel" name="phone" value={newHomestead.phone} onChange={handleHomesteadChange} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white" placeholder="+268 ..." />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">GPS Coordinates</label>
                    <div className="flex gap-3">
                      <input type="text" value={newHomestead.gps} readOnly className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white" />
                      <button onClick={getCurrentLocation} className="px-6 bg-slate-700 hover:bg-slate-600 rounded-2xl">📍 Get GPS</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Payee</label>
                    <select name="payee" value={newPayment.payee} onChange={handlePaymentChange} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white">
                      <option value="">Select Home Owner</option>
                      {homesteads.map(h => (
                        <option key={h.id} value={h.owner}>{h.owner} (Out: {formatCurrency(h.outstanding)})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Amount Paid (E)</label>
                    <input type="number" name="amount" value={newPayment.amount} onChange={handlePaymentChange} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white" min="1" step="0.01" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Payment Method</label>
                    <select name="method" value={newPayment.method} onChange={handlePaymentChange} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white">
                      <option value="">Select Method</option>
                      {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 border border-slate-700 rounded-2xl font-medium">Cancel</button>
                <button onClick={modalType === 'homestead' ? handleAddHomestead : handleAddPayment} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-medium">
                  {modalType === 'homestead' ? 'Add Homestead' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-center" richColors />
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 py-3 z-50">
        <div className="flex justify-around items-center text-[10px] font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} onClick={() => setActiveTab(item.name)} className={`flex flex-col items-center cursor-pointer transition-all active:scale-95 ${activeTab === item.name ? 'text-emerald-400 scale-110' : 'text-slate-400 hover:text-slate-300'}`}>
                <Icon size={24} strokeWidth={2.25} className="mb-1" />
                <span>{item.name}</span>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DashboardApp;