import React, { useState, useEffect } from 'react';
import { Plus, Home, FileText, Calendar, Users, MessageSquare, TrendingUp, Settings, LogOut, ChevronRight, Check, X, Camera, Star, Share2, DollarSign, Clock, AlertCircle, Download, Edit2, Trash2, Eye, EyeOff, Copy, Send } from 'lucide-react';

export default function BardonSaaS() {
  const [view, setView] = useState('dashboard');
  const [data, setData] = useState({
    customers: [],
    quotes: [],
    jobs: [],
    reviews: [],
    referrals: [],
    payments: [],
    team: [],
    messages: []
  });
  const [currentQuote, setCurrentQuote] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await window.storage?.get('bardon-saas-data');
        if (result?.value) {
          setData(JSON.parse(result.value));
        }
      } catch (error) {
        console.log('Starting fresh');
      }
    };
    loadData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await window.storage?.set('bardon-saas-data', JSON.stringify(data));
      } catch (error) {
        console.log('Could not save');
      }
    };
    if (data.customers.length > 0 || data.quotes.length > 0 || data.jobs.length > 0) {
      saveData();
    }
  }, [data]);

  // Helper functions
  const addCustomer = (customer) => {
    const newCustomer = {
      id: Date.now(),
      dateAdded: new Date().toLocaleDateString(),
      totalSpend: 0,
      jobCount: 0,
      lastService: null,
      preferences: [],
      referredBy: null,
      referralCount: 0,
      ...customer
    };
    setData({ ...data, customers: [newCustomer, ...data.customers] });
    return newCustomer;
  };

  const createQuote = (quote) => {
    const newQuote = {
      id: Date.now(),
      status: 'draft',
      createdDate: new Date().toLocaleDateString(),
      sentDate: null,
      approvedDate: null,
      depositInvoiced: false,
      ...quote
    };
    setData({ ...data, quotes: [newQuote, ...data.quotes] });
    return newQuote;
  };

  const sendQuote = (quoteId) => {
    setData({
      ...data,
      quotes: data.quotes.map(q => q.id === quoteId ? {...q, status: 'sent', sentDate: new Date().toLocaleDateString()} : q)
    });
  };

  const approveQuote = (quoteId) => {
    const quote = data.quotes.find(q => q.id === quoteId);
    setData({
      ...data,
      quotes: data.quotes.map(q => q.id === quoteId ? {...q, status: 'approved', approvedDate: new Date().toLocaleDateString(), depositInvoiced: true} : q),
      payments: [...data.payments, {
        id: Date.now(),
        quoteId,
        customerId: quote.customerId,
        type: 'deposit',
        amount: quote.total * 0.5,
        status: 'pending',
        dueDate: new Date().toLocaleDateString(),
        stripeLink: `https://pay.stripe.com/deposit-${quoteId}`
      }]
    });
  };

  const completePayment = (paymentId) => {
    setData({
      ...data,
      payments: data.payments.map(p => p.id === paymentId ? {...p, status: 'paid', paidDate: new Date().toLocaleDateString()} : p)
    });
  };

  const createJob = (job) => {
    const newJob = {
      id: Date.now(),
      status: 'scheduled',
      createdDate: new Date().toLocaleDateString(),
      photos: [],
      checklist: [],
      notes: '',
      timeLogged: 0,
      completionDate: null,
      ...job
    };
    setData({ ...data, jobs: [newJob, ...data.jobs] });
    return newJob;
  };

  const completeJob = (jobId) => {
    const job = data.jobs.find(j => j.id === jobId);
    setData({
      ...data,
      jobs: data.jobs.map(j => j.id === jobId ? {...j, status: 'completed', completionDate: new Date().toLocaleDateString()} : j),
      messages: [...data.messages, {
        id: Date.now(),
        customerId: job.customerId,
        type: 'review_request',
        content: `Hi ${job.customerName}, thanks for choosing Bardon Clean! Would you mind leaving a quick review? It really helps us.`,
        timestamp: new Date().toLocaleString(),
        sent: true
      }]
    });
  };

  // Calculate stats
  const stats = {
    totalRevenue: data.payments.filter(p => p.status === 'paid' && p.type === 'final').reduce((sum, p) => sum + p.amount, 0),
    outstandingPayments: data.payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    totalCustomers: data.customers.length,
    jobsThisMonth: data.jobs.filter(j => new Date(j.createdDate).getMonth() === new Date().getMonth()).length,
    reviewsReceived: data.reviews.length,
    referralCount: data.referrals.length
  };

  // Service revenue breakdown
  const serviceRevenue = {};
  data.payments.filter(p => p.status === 'paid').forEach(payment => {
    const quote = data.quotes.find(q => q.id === payment.quoteId);
    if (quote) {
      serviceRevenue[quote.serviceType] = (serviceRevenue[quote.serviceType] || 0) + payment.amount;
    }
  });

  // ============ DASHBOARD VIEW ============
  if (view === 'dashboard') {
    const pendingQuotes = data.quotes.filter(q => q.status === 'sent');
    const recentJobs = data.jobs.slice(0, 3);
    const topReferrers = data.customers.filter(c => c.referralCount > 0).sort((a, b) => b.referralCount - a.referralCount).slice(0, 3);

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        {/* Header */}
        <div className="bg-white border-b border-orange-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800" style={{fontFamily: 'Playfair Display'}}>Bardon Clean</h1>
              <p className="text-sm text-gray-500">Business Management Platform</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView('settings')} className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border-l-4 border-orange-600 shadow-sm">
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Revenue</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">${stats.totalRevenue.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-2">Paid invoices</p>
            </div>

            <div className="bg-white rounded-lg p-6 border-l-4 border-red-600 shadow-sm">
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Outstanding</p>
              <p className="text-3xl font-bold text-red-600 mt-2">${stats.outstandingPayments.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-2">Awaiting payment</p>
            </div>

            <div className="bg-white rounded-lg p-6 border-l-4 border-blue-600 shadow-sm">
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Customers</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalCustomers}</p>
              <p className="text-xs text-gray-500 mt-2">Total base</p>
            </div>

            <div className="bg-white rounded-lg p-6 border-l-4 border-green-600 shadow-sm">
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Reviews</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.reviewsReceived}</p>
              <p className="text-xs text-gray-500 mt-2">Positive feedback</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pending Quotes */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-yellow-600">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
                  <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">{pendingQuotes.length}</span>
                </div>
                {pendingQuotes.length > 0 ? (
                  <div className="space-y-3">
                    {pendingQuotes.map(quote => (
                      <div key={quote.id} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{quote.customerName}</p>
                          <p className="text-sm text-gray-600">${quote.total.toFixed(2)} • Sent {quote.sentDate}</p>
                        </div>
                        <button onClick={() => setView('quotes')} className="text-yellow-600 hover:text-yellow-800 font-semibold text-sm">
                          Follow up
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No pending quotes</p>
                )}
              </div>

              {/* Recent Jobs */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-blue-600">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Upcoming Jobs</h2>
                  <button onClick={() => setView('jobs')} className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center gap-1">
                    View all <ChevronRight size={16} />
                  </button>
                </div>
                {recentJobs.length > 0 ? (
                  <div className="space-y-3">
                    {recentJobs.filter(j => j.status !== 'completed').map(job => (
                      <div key={job.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{job.customerName}</p>
                            <p className="text-sm text-gray-600">{job.address}</p>
                            <p className="text-xs text-gray-500 mt-1">{job.serviceType} • {job.scheduledDate}</p>
                          </div>
                          <button onClick={() => {setCurrentJob(job); setView('jobs');}} className="text-blue-600 hover:text-blue-800">
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No upcoming jobs</p>
                )}
              </div>

              {/* Service Revenue Breakdown */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-purple-600">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Revenue by Service</h2>
                <div className="grid grid-cols-2 gap-4">
                  {['Bond Clean', 'Pre-Sale', 'Deep Clean', 'Regular'].map(service => {
                    const serviceKey = service.toLowerCase().replace('-', '').replace(' ', '');
                    const amount = serviceRevenue[serviceKey] || 0;
                    return (
                      <div key={service} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-600 font-semibold">{service}</p>
                        <p className="text-2xl font-bold text-purple-600 mt-2">${amount.toFixed(0)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-green-600">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button onClick={() => setView('quotes')} className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center justify-center gap-2">
                    <Plus size={18} /> Create Quote
                  </button>
                  <button onClick={() => setView('jobs')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    <Calendar size={18} /> Schedule Job
                  </button>
                  <button onClick={() => setView('customers')} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
                    <Users size={18} /> Manage Customers
                  </button>
                </div>
              </div>

              {/* Top Referrers */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-green-600">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Top Referrers</h2>
                {topReferrers.length > 0 ? (
                  <div className="space-y-3">
                    {topReferrers.map(customer => (
                      <div key={customer.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-800 text-sm">{customer.name}</p>
                          <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{customer.referralCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 text-sm">No referrals yet</p>
                )}
              </div>

              {/* Key Metrics */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-indigo-600">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Key Metrics</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase text-gray-600 font-semibold">Average Job Value</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                      ${data.jobs.length > 0 ? (stats.totalRevenue / data.jobs.filter(j => j.status === 'completed').length).toFixed(0) : 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-600 font-semibold">Customer LTV</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                      ${stats.totalCustomers > 0 ? (stats.totalRevenue / stats.totalCustomers).toFixed(0) : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ QUOTES VIEW ============
  if (view === 'quotes') {
    const [newQuoteForm, setNewQuoteForm] = useState({
      customerName: '',
      email: '',
      phone: '',
      address: '',
      serviceType: '',
      description: '',
      hours: '',
      hourlyRate: 100,
      addOns: [],
      gstIncluded: true
    });

    const calculateTotal = () => {
      const subtotal = (parseFloat(newQuoteForm.hours) || 0) * newQuoteForm.hourlyRate;
      const addOnsTotal = newQuoteForm.addOns.reduce((sum, addon) => sum + (addon.price || 0), 0);
      const total = subtotal + addOnsTotal;
      return {
        subtotal: subtotal + addOnsTotal,
        gst: (subtotal + addOnsTotal) * 0.1,
        total: newQuoteForm.gstIncluded ? (subtotal + addOnsTotal) * 1.1 : subtotal + addOnsTotal
      };
    };

    const handleCreateQuote = () => {
      if (!newQuoteForm.customerName || !newQuoteForm.serviceType) return;
      
      const totals = calculateTotal();
      const quote = createQuote({
        customerName: newQuoteForm.customerName,
        email: newQuoteForm.email,
        phone: newQuoteForm.phone,
        address: newQuoteForm.address,
        serviceType: newQuoteForm.serviceType,
        description: newQuoteForm.description,
        hours: newQuoteForm.hours,
        hourlyRate: newQuoteForm.hourlyRate,
        addOns: newQuoteForm.addOns,
        subtotal: totals.subtotal,
        gst: totals.gst,
        total: totals.total,
        gstIncluded: newQuoteForm.gstIncluded
      });

      setNewQuoteForm({
        customerName: '',
        email: '',
        phone: '',
        address: '',
        serviceType: '',
        description: '',
        hours: '',
        hourlyRate: 100,
        addOns: [],
        gstIncluded: true
      });

      alert('Quote created! Now send it to the customer.');
    };

    const totals = calculateTotal();

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8">
        <button onClick={() => setView('dashboard')} className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2">
          ← Back to Dashboard
        </button>

        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8" style={{fontFamily: 'Playfair Display'}}>Quotes & Proposals</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quote Creator */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-8 border-t-4 border-orange-600">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Quote</h2>

              <div className="space-y-6">
                {/* Customer Info */}
                <div className="border-b pb-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={newQuoteForm.customerName}
                      onChange={(e) => setNewQuoteForm({...newQuoteForm, customerName: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newQuoteForm.email}
                      onChange={(e) => setNewQuoteForm({...newQuoteForm, email: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newQuoteForm.phone}
                      onChange={(e) => setNewQuoteForm({...newQuoteForm, phone: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
                    />
                    <input
                      type="text"
                      placeholder="Property Address"
                      value={newQuoteForm.address}
                      onChange={(e) => setNewQuoteForm({...newQuoteForm, address: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
                    />
                  </div>
                </div>

                {/* Service Details */}
                <div className="border-b pb-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Service Details</h3>
                  <select
                    value={newQuoteForm.serviceType}
                    onChange={(e) => setNewQuoteForm({...newQuoteForm, serviceType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 mb-4"
                  >
                    <option value="">Select Service Type</option>
                    <option value="bond">Bond Clean</option>
                    <option value="presale">Pre-Sale Clean</option>
                    <option value="deep">Deep Clean</option>
                    <option value="regular">Regular Clean</option>
                  </select>

                  <textarea
                    placeholder="Service Description (what's included)"
                    value={newQuoteForm.description}
                    onChange={(e) => setNewQuoteForm({...newQuoteForm, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 mb-4"
                    rows="4"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Hours"
                      value={newQuoteForm.hours}
                      onChange={(e) => setNewQuoteForm({...newQuoteForm, hours: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
                    />
                    <input
                      type="number"
                      placeholder="Hourly Rate"
                      value={newQuoteForm.hourlyRate}
                      onChange={(e) => setNewQuoteForm({...newQuoteForm, hourlyRate: parseFloat(e.target.value)})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
                    />
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-gray-800 mb-4">Pricing Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Service ({newQuoteForm.hours} hours @ ${newQuoteForm.hourlyRate})</span>
                      <span className="font-semibold text-gray-800">${(parseFloat(newQuoteForm.hours) * newQuoteForm.hourlyRate || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-800">${totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">GST (10%)</span>
                        <span className="font-semibold text-gray-800">${totals.gst.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="text-lg font-bold text-gray-800">Total</span>
                        <span className="text-lg font-bold text-orange-600">${totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreateQuote}
                  disabled={!newQuoteForm.customerName || !newQuoteForm.serviceType}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 transition"
                >
                  Create Quote
                </button>
              </div>
            </div>

            {/* Quotes List */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-600">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Quotes</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {data.quotes.slice(0, 10).map(quote => (
                  <div key={quote.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-800 text-sm">{quote.customerName}</p>
                    <p className="text-xs text-gray-600 mt-1">${quote.total.toFixed(2)}</p>
                    <div className="flex gap-2 mt-3">
                      {quote.status === 'draft' && (
                        <>
                          <button
                            onClick={() => sendQuote(quote.id)}
                            className="flex-1 text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                          >
                            <Send size={12} /> Send
                          </button>
                        </>
                      )}
                      {quote.status === 'sent' && (
                        <>
                          <button
                            onClick={() => approveQuote(quote.id)}
                            className="flex-1 text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                        </>
                      )}
                      {quote.status === 'approved' && (
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">Approved ✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{quote.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ JOBS VIEW ============
  if (view === 'jobs') {
    const [newJobForm, setNewJobForm] = useState({
      customerName: '',
      customerId: '',
      address: '',
      serviceType: '',
      scheduledDate: '',
      scheduledTime: '',
      notes: ''
    });

    const handleCreateJob = () => {
      if (!newJobForm.customerName || !newJobForm.serviceType) return;
      
      createJob({
        ...newJobForm,
        status: 'scheduled'
      });

      setNewJobForm({
        customerName: '',
        customerId: '',
        address: '',
        serviceType: '',
        scheduledDate: '',
        scheduledTime: '',
        notes: ''
      });

      alert('Job scheduled!');
    };

    const scheduledJobs = data.jobs.filter(j => j.status === 'scheduled');
    const inProgressJobs = data.jobs.filter(j => j.status === 'in_progress');
    const completedJobs = data.jobs.filter(j => j.status === 'completed');

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8">
        <button onClick={() => setView('dashboard')} className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2">
          ← Back to Dashboard
        </button>

        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8" style={{fontFamily: 'Playfair Display'}}>Job Management</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
            {/* Create Job */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-lg p-6 border-t-4 border-orange-600">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Schedule Job</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={newJobForm.customerName}
                  onChange={(e) => setNewJobForm({...newJobForm, customerName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newJobForm.address}
                  onChange={(e) => setNewJobForm({...newJobForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                />
                <select
                  value={newJobForm.serviceType}
                  onChange={(e) => setNewJobForm({...newJobForm, serviceType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                >
                  <option value="">Service Type</option>
                  <option value="bond">Bond Clean</option>
                  <option value="presale">Pre-Sale</option>
                  <option value="deep">Deep Clean</option>
                  <option value="regular">Regular</option>
                </select>
                <input
                  type="date"
                  value={newJobForm.scheduledDate}
                  onChange={(e) => setNewJobForm({...newJobForm, scheduledDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-sm"
                />
                <button
                  onClick={handleCreateJob}
                  disabled={!newJobForm.customerName || !newJobForm.serviceType}
                  className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 text-sm"
                >
                  Schedule
                </button>
              </div>
            </div>

            {/* Scheduled */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-600">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Scheduled ({scheduledJobs.length})
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {scheduledJobs.map(job => (
                  <div key={job.id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-800 text-sm">{job.customerName}</p>
                    <p className="text-xs text-gray-600">{job.address}</p>
                    <p className="text-xs text-gray-500 mt-1">{job.scheduledDate}</p>
                    <button
                      onClick={() => setData({
                        ...data,
                        jobs: data.jobs.map(j => j.id === job.id ? {...j, status: 'in_progress'} : j)
                      })}
                      className="w-full mt-2 text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
                    >
                      Start Job
                    </button>
                  </div>
                ))}
                {scheduledJobs.length === 0 && <p className="text-gray-500 text-center py-4 text-xs">No scheduled jobs</p>}
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-yellow-600">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-yellow-600" />
                In Progress ({inProgressJobs.length})
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {inProgressJobs.map(job => (
                  <div key={job.id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-gray-800 text-sm">{job.customerName}</p>
                    <p className="text-xs text-gray-600">{job.serviceType}</p>
                    <button
                      onClick={() => completeJob(job.id)}
                      className="w-full mt-2 text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700"
                    >
                      Complete & Photo
                    </button>
                  </div>
                ))}
                {inProgressJobs.length === 0 && <p className="text-gray-500 text-center py-4 text-xs">No jobs in progress</p>}
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-600">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Check size={20} className="text-green-600" />
                Completed ({completedJobs.length})
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedJobs.slice(0, 5).map(job => (
                  <div key={job.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-800 text-sm">{job.customerName}</p>
                    <p className="text-xs text-gray-500">{job.completionDate}</p>
                    <p className="text-xs text-green-700 font-semibold mt-1">✓ Done</p>
                  </div>
                ))}
                {completedJobs.length === 0 && <p className="text-gray-500 text-center py-4 text-xs">No completed jobs</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ CUSTOMERS VIEW ============
  if (view === 'customers') {
    const [newCustomerForm, setNewCustomerForm] = useState({
      name: '',
      email: '',
      phone: '',
      address: '',
      preferences: ''
    });

    const handleAddCustomer = () => {
      if (!newCustomerForm.name || !newCustomerForm.phone) return;
      
      addCustomer({
        name: newCustomerForm.name,
        email: newCustomerForm.email,
        phone: newCustomerForm.phone,
        address: newCustomerForm.address,
        preferences: newCustomerForm.preferences.split(',').map(p => p.trim())
      });

      setNewCustomerForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        preferences: ''
      });

      alert('Customer added!');
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8">
        <button onClick={() => setView('dashboard')} className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2">
          ← Back to Dashboard
        </button>

        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8" style={{fontFamily: 'Playfair Display'}}>Customer Database</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
            {/* Add Customer */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-600">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Add Customer</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-sm"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-sm"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-sm"
                />
                <input
                  type="text"
                  placeholder="Preferences (comma separated)"
                  value={newCustomerForm.preferences}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, preferences: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-sm"
                />
                <button
                  onClick={handleAddCustomer}
                  disabled={!newCustomerForm.name || !newCustomerForm.phone}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 text-sm"
                >
                  Add Customer
                </button>
              </div>
            </div>

            {/* Customers List */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-600">
              <h2 className="text-lg font-bold text-gray-800 mb-4">All Customers ({data.customers.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {data.customers.map(customer => {
                  const customerJobs = data.jobs.filter(j => j.customerId === customer.id && j.status === 'completed');
                  const totalSpent = customerJobs.reduce((sum, j) => {
                    const quote = data.quotes.find(q => q.id === j.quoteId);
                    return sum + (quote?.total || 0);
                  }, 0);
                  
                  return (
                    <div key={customer.id} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">{customer.name}</p>
                          <p className="text-xs text-gray-600">{customer.phone}</p>
                          <p className="text-xs text-gray-600">{customer.address}</p>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded text-xs space-y-1 mb-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Jobs:</span>
                          <span className="font-semibold">{customerJobs.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Spent:</span>
                          <span className="font-semibold">${totalSpent.toFixed(0)}</span>
                        </div>
                        {customer.preferences.length > 0 && (
                          <div className="text-gray-600">
                            <span className="text-xs">Preferences: {customer.preferences.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <button className="w-full text-xs bg-purple-600 text-white py-1 rounded hover:bg-purple-700">
                        View Profile
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ REVIEWS VIEW ============
  if (view === 'reviews') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8">
        <button onClick={() => setView('dashboard')} className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2">
          ← Back to Dashboard
        </button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8" style={{fontFamily: 'Playfair Display'}}>Reviews & Feedback</h1>

          <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-green-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Automation</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">After each completed job, customers automatically receive a review request via SMS and email.</p>
              
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <p className="font-semibold text-gray-800 mb-3">Sample Review Request:</p>
                <p className="text-gray-700 italic">
                  "Hi [Customer], thanks for choosing Bardon Clean! We'd love your feedback. How did we go? [Review Link]"
                </p>
              </div>

              <div className="mt-8">
                <h3 className="font-bold text-gray-800 mb-4">Reviews Received ({data.reviews.length})</h3>
                {data.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {data.reviews.map(review => (
                      <div key={review.id} className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-800">{review.customerName}</p>
                          <div className="flex gap-1">
                            {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} className="text-yellow-500 fill-yellow-500" />)}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{review.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews yet. Complete jobs to send review requests.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ ANALYTICS VIEW ============
  if (view === 'analytics') {
    const monthlyRevenue = {};
    data.payments.filter(p => p.status === 'paid').forEach(payment => {
      const month = new Date(payment.paidDate || new Date()).toLocaleDateString('en-AU', { month: 'short' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + payment.amount;
    });

    const completedJobs = data.jobs.filter(j => j.status === 'completed');
    const avgJobValue = completedJobs.length > 0 ? stats.totalRevenue / completedJobs.length : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8">
        <button onClick={() => setView('dashboard')} className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2">
          ← Back to Dashboard
        </button>

        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8" style={{fontFamily: 'Playfair Display'}}>Financial Analytics</h1>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-600">
              <p className="text-gray-600 text-sm font-semibold uppercase">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600 mt-2">${stats.totalRevenue.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
              <p className="text-gray-600 text-sm font-semibold uppercase">Outstanding</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">${stats.outstandingPayments.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-600">
              <p className="text-gray-600 text-sm font-semibold uppercase">Avg Job Value</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">${avgJobValue.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-600">
              <p className="text-gray-600 text-sm font-semibold uppercase">Customer LTV</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">${data.customers.length > 0 ? (stats.totalRevenue / data.customers.length).toFixed(0) : 0}</p>
            </div>
          </div>

          {/* Service Revenue */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-purple-600 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Revenue by Service Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['Bond', 'Pre-Sale', 'Deep', 'Regular'].map(service => {
                const key = service.toLowerCase();
                const amount = serviceRevenue[key] || 0;
                const percentage = stats.totalRevenue > 0 ? ((amount / stats.totalRevenue) * 100).toFixed(1) : 0;
                return (
                  <div key={service} className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                    <p className="font-bold text-gray-800">{service} Clean</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">${amount.toFixed(0)}</p>
                    <p className="text-xs text-gray-600 mt-2">{percentage}% of revenue</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* P&L Summary */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-indigo-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Profit & Loss Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-700">Total Revenue</span>
                <span className="text-xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-700">Outstanding Invoices</span>
                <span className="text-lg font-semibold text-orange-600">${stats.outstandingPayments.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-4">
                <span className="text-gray-700 font-semibold">Net Cash Flow</span>
                <span className="text-xl font-bold text-blue-600">${(stats.totalRevenue - (stats.outstandingPayments * 0.5)).toFixed(2)}</span>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg mt-6">
                <p className="text-sm text-gray-600 mb-2">💡 Pro Tip: Focus on completing 2-3 more jobs to increase revenue by 15-20%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default view - show dashboard
  return <div className="p-8 text-center"><p>Loading...</p></div>;
}

export default BardonSaaS;