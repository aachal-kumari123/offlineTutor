import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PoolCard = ({ pool, onUpdate, teacherView = false }) => {
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const memberCount = pool.students?.length || pool.connections?.length || 1;
  const perStudent = Math.round(pool.perStudentFees || pool.totalFees / Math.max(memberCount, 1) || pool.totalFee / Math.max(memberCount, 1));

  const joinPool = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/pools/${pool._id}/join`);
      toast.success(data.message);
      onUpdate?.(data.pool);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not join pool');
    } finally {
      setBusy(false);
    }
  };

  const continueOneToOne = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/pools/${pool._id}/one-to-one`);
      toast.success(data.message);
      onUpdate?.(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update pool choice');
    } finally {
      setBusy(false);
    }
  };

  const assignPool = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/pools/${pool._id}/assign`);
      toast.success(data.message);
      onUpdate?.(data.pool);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not assign pool');
    } finally {
      setBusy(false);
    }
  };

  const payPoolShare = async () => {
    setBusy(true);
    try {
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Razorpay Checkout could not load'));
          document.body.appendChild(script);
        });
      }
      const { data } = await api.post(`/pools/${pool._id}/payment/order`);
      if (data.alreadyPaid) {
        toast.success('Your pool share is already paid');
        onUpdate?.(data.pool);
        return;
      }
      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'TutorConnect',
        description: `${pool.poolCode} group tuition share`,
        order_id: data.order.id,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone || '' },
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          try {
            const verification = await api.post(`/pools/${pool._id}/payment/verify`, response);
            toast.success(verification.data.message);
            onUpdate?.(verification.data.pool);
          } catch (error) {
            toast.error(error.response?.data?.message || 'Payment verification failed');
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) }
      });
      checkout.on('payment.failed', () => {
        setBusy(false);
        toast.error('Payment failed. Please try again.');
      });
      checkout.open();
    } catch (error) {
      setBusy(false);
      toast.error(error.response?.data?.message || error.message || 'Could not start payment');
    }
  };

  const myPayment = pool.payments?.find((payment) => payment.student?._id === user?.id || payment.student === user?.id);
  const paidCount = pool.payments?.filter((payment) => payment.status === 'PAID').length || 0;

  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900 dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wider text-emerald-700">{pool.poolCode}</p>
          <h3 className="mt-1 font-bold">{memberCount} students near {pool.area}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{pool.studentClass} {pool.subject}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">₹{perStudent} each</span>
      </div>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">₹{pool.totalFees || pool.totalFee || 1500} total • {pool.status}</p>
      {pool.teacher && <p className="mt-2 text-sm font-semibold text-primary-700 dark:text-primary-300">Tutor: {pool.teacher.name} accepted this group</p>}
      {(pool.status === 'ASSIGNED_TO_TEACHER' || pool.status === 'FULL') && <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Payments collected: {paidCount}/{memberCount}</p>}
      {teacherView ? (
        <>
          {pool.status === 'OPEN' && <p className="mt-3 text-sm text-amber-700">Waiting for {Math.max((pool.maxSize || 3) - memberCount, 0)} more student{memberCount === 2 ? '' : 's'}.</p>}
          <button type="button" disabled={busy || pool.status !== 'FULL'} onClick={assignPool} className="btn-primary mt-3 text-sm disabled:opacity-50">{busy ? 'Assigning...' : pool.status === 'ASSIGNED_TO_TEACHER' ? 'Group accepted' : 'Accept group of 3'}</button>
        </>
      ) : pool.status === 'ASSIGNED_TO_TEACHER' && myPayment?.status !== 'PAID' ? (
        <button type="button" disabled={busy} onClick={payPoolShare} className="btn-primary mt-3 text-sm disabled:opacity-50">{busy ? 'Opening payment...' : `Pay ₹${myPayment?.amount || perStudent} to Start Classes`}</button>
      ) : pool.groupReady ? (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">All 3 students paid. Your group is ready!</p>
      ) : pool.status === 'OPEN' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={joinPool} className="btn-primary text-sm disabled:opacity-50">Join Pool & Save Money</button>
          <button type="button" disabled={busy} onClick={continueOneToOne} className="btn-secondary text-sm disabled:opacity-50">No, I want 1-to-1</button>
        </div>
      ) : null}
    </div>
  );
};

export default PoolCard;
