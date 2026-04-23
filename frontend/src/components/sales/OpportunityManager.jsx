import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { 
  CurrencyDollarIcon, 
  ShoppingBagIcon, 
  PlusIcon,
  CheckBadgeIcon,
  NoSymbolIcon,
  CalculatorIcon,
  TagIcon,
  InboxStackIcon
} from '@heroicons/react/24/outline';

const OpportunityManager = ({ leadId, leadStatus, pipelineStage }) => {
  const [opportunity, setOpportunity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [product, setProduct] = useState({ product_name: '', mrp: '', discount: '0', quantity: '1' });
  const [lostReason, setLostReason] = useState('');
  const [showLostModal, setShowLostModal] = useState(false);

  const fetchOpportunity = async () => {
    try {
      const response = await api.get(`/opportunities/lead/${leadId}`);
      setOpportunity(response.data);
    } catch (err) {
      console.error('Error fetching opportunity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunity();
  }, [leadId]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!product.product_name || !product.mrp || product.quantity < 1) {
      alert('Please fill in all product details.');
      return;
    }

    try {
      await api.post('/opportunities/items', {
        opportunity_id: opportunity.id,
        ...product
      });
      setProduct({ product_name: '', mrp: '', discount: '0', quantity: '1' });
      setShowProductForm(false);
      fetchOpportunity();
    } catch (err) {
      console.error('Error adding product:', err);
      alert(err.response?.data?.message || 'Failed to add product.');
    }
  };

  const handleUpdateStatus = async (status) => {
    if (status === 'won' && (!opportunity.items || opportunity.items.length === 0)) {
      alert('Cannot mark as WON without adding products. Please move to Negotiation and add products first.');
      return;
    }

    if (status === 'lost' && !lostReason) {
       setShowLostModal(true);
       return;
    }

    try {
      await api.put(`/opportunities/${opportunity.id}/status`, {
        status,
        lost_reason: lostReason
      });
      fetchOpportunity();
      alert(`Deal marked as ${status.toUpperCase()}!`);
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update deal status.');
    }
  };

  if (isLoading) return <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  if (!opportunity) {
    return (
      <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] text-center">
         <InboxStackIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
         <h4 className="font-bold text-slate-900">No Active Opportunity</h4>
         <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2">Log a Demo or Negotiation activity to automatically trigger an opportunity for this lead.</p>
      </div>
    );
  }

  const isClosed = leadStatus === 'Converted' || leadStatus === 'Lost' || opportunity.status !== 'open';
  const canAddProducts = pipelineStage === 'negotiation' && !isClosed;

  return (
    <div className="glass-card rounded-[2.5rem] p-8 border border-white/40 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
         <CurrencyDollarIcon className="w-24 h-24 text-slate-900" />
      </div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Deal Management</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full ${opportunity.status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
             {opportunity.status.toUpperCase()} Opportunity #{opportunity.id}
          </p>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Deal Value</p>
           <p className="text-2xl font-black text-slate-900">${parseFloat(opportunity.total_amount || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-4 mb-10 relative z-10">
         <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ShoppingBagIcon className="w-4 h-4" />
            Product Basket
         </h4>
         <div className="space-y-3">
            {opportunity.items?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all">
                 <div>
                    <p className="font-bold text-slate-800">{item.product_name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Qty: {item.quantity} × ${item.final_price}</p>
                 </div>
                 <div className="text-right">
                    <p className="font-black text-slate-900">${parseFloat(item.total).toLocaleString()}</p>
                    {item.discount > 0 && <p className="text-[10px] text-emerald-600 font-bold">-${item.discount} disc.</p>}
                 </div>
              </div>
            ))}
            {(!opportunity.items || opportunity.items.length === 0) && (
              <div className="text-center py-10 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                 <CalculatorIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                 <p className="text-slate-400 text-xs italic font-medium">No products added yet.</p>
              </div>
            )}
         </div>
         
         {!isClosed ? (
           canAddProducts ? (
            <button 
              onClick={() => setShowProductForm(!showProductForm)}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-xs font-bold hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              {showProductForm ? 'Cancel Product Entry' : 'Add Product to Deal'}
            </button>
           ) : (
            <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-amber-100">
               ⚠️ Reach "Negotiation" stage to add products
            </div>
           )
         ) : null}
      </div>

      {/* Product Entry Form */}
      {showProductForm && (
        <form onSubmit={handleAddProduct} className="mb-10 p-6 bg-slate-900 rounded-3xl text-white space-y-4 animate-in slide-in-from-top-4 duration-300 shadow-2xl ring-1 ring-white/10">
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Product Name</label>
                 <input 
                   required
                   value={product.product_name}
                   onChange={e => setProduct({...product, product_name: e.target.value})}
                   className="w-full bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 transition-all" 
                 />
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">MRP ($)</label>
                 <input 
                   type="number"
                   required
                   value={product.mrp}
                   onChange={e => setProduct({...product, mrp: e.target.value})}
                   className="w-full bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 transition-all" 
                 />
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Discount ($)</label>
                 <input 
                   type="number"
                   value={product.discount}
                   onChange={e => setProduct({...product, discount: e.target.value})}
                   className="w-full bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 transition-all" 
                 />
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Quantity</label>
                 <input 
                   type="number"
                   min="1"
                   required
                   value={product.quantity}
                   onChange={e => setProduct({...product, quantity: e.target.value})}
                   className="w-full bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 transition-all" 
                 />
              </div>
           </div>
           <button type="submit" className="w-full py-4 bg-blue-600 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]">
              Commit Item to Opportunity
           </button>
        </form>
      )}

      {/* Action Section */}
      {!isClosed ? (
        <div className="grid grid-cols-2 gap-4 relative z-10 pt-6 border-t border-slate-100">
           <button 
             onClick={() => handleUpdateStatus('won')}
             className="flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
           >
              <CheckBadgeIcon className="w-5 h-5" />
              Mark as WON
           </button>
           <button 
             onClick={() => handleUpdateStatus('lost')}
             className="flex items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
           >
              <NoSymbolIcon className="w-5 h-5" />
              Mark as LOST
           </button>
        </div>
      ) : (
        <div className={`p-6 rounded-3xl text-center font-black uppercase tracking-[0.2em] text-xs ${
          opportunity.status === 'won' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
           {opportunity.status === 'won' ? '🎉 Deal Successfully Won' : '❌ Opportunity Lost'}
           {opportunity.lost_reason && <p className="mt-2 text-[10px] font-medium lowercase tracking-normal text-rose-500">Reason: {opportunity.lost_reason}</p>}
        </div>
      )}

      {/* Lost Reason Modal */}
      {showLostModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-black text-slate-900 mb-2">Loss Analysis</h3>
              <p className="text-slate-500 text-xs font-bold mb-6 uppercase">Why was this opportunity lost?</p>
              <textarea 
                value={lostReason}
                onChange={e => setLostReason(e.target.value)}
                placeholder="Competitor price, feature gap, budget issues..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-medium text-slate-700 resize-none h-32 mb-6"
              />
              <div className="flex gap-3">
                 <button onClick={() => setShowLostModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-400">Cancel</button>
                 <button onClick={() => { handleUpdateStatus('lost'); setShowLostModal(false); }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100">Confirm Loss</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityManager;
