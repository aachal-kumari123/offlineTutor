import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { imageFileToDataUrl } from '../utils/image';
import { mediaFileToDataUrl } from '../utils/media';
import PoolCard from '../components/PoolCard';
import {
  HiOutlineUser,
  HiOutlineAcademicCap,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiOutlinePencil,
  HiOutlineInbox,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineChatAlt2,
  HiOutlineDocumentText,
} from 'react-icons/hi';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PROGRESS_STEPS = [
  ['request_sent', 'Request Sent'],
  ['accepted', 'Accepted'],
  ['demo_done', 'Demo Done'],
  ['classes_started', 'Classes Started']
];

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [pools, setPools] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [updatingRequest, setUpdatingRequest] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [rejectionRequest, setRejectionRequest] = useState(null);
  const [rejectionForm, setRejectionForm] = useState({ reason: '', day: '', start: '', end: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [chatConnection, setChatConnection] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(null);
  const [poolForm, setPoolForm] = useState({ subject: '', studentClass: '', area: '', lat: '26.84', lng: '80.99' });
  const [creatingPool, setCreatingPool] = useState(false);

  const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Razorpay Checkout could not load'));
    document.body.appendChild(script);
  });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoadingRequests(true);
      try {
        const { data } = await api.get('/contact/my-requests');
        setRequests(data.connections || []);
      } catch {
        setRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };
    load();

    const loadPools = async () => {
      try {
        const poolResponse = await api.get('/pools');
        setPools(poolResponse.data.pools || []);
      } catch {
        setPools([]);
      }
    };
    loadPools();
  }, [user]);

  const createStudentPool = async (event) => {
    event.preventDefault();
    setCreatingPool(true);
    try {
      const { data } = await api.post('/pools/find-or-create-pool', {
        subject: poolForm.subject,
        studentClass: poolForm.studentClass,
        area: poolForm.area,
        location: { lat: Number(poolForm.lat), lng: Number(poolForm.lng) },
        budget: 1500
      });
      setPools((current) => [data.pool, ...current.filter((pool) => pool._id !== data.pool._id)]);
      toast.success(data.message);
      setPoolForm((current) => ({ ...current, subject: '', studentClass: '', area: '' }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create a group pool');
    } finally {
      setCreatingPool(false);
    }
  };

  const handleRequestStatus = async (requestId, status, details = {}) => {
    setUpdatingRequest(requestId);
    try {
      const { data } = await api.put(`/contact/${requestId}/status`, { status, ...details });
      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request._id === requestId ? { ...request, ...data.connection, status } : request
        )
      );
      toast.success(
        data.emailSent
          ? `Request ${status}. The student has been notified by email.`
          : `Request ${status}, but the student email notification could not be sent.`
      );
          return true;
    } catch (err) {
      if (err.response?.status === 402 && err.response.data.paymentRequired) {
        setPaymentRequest({
          requestId,
          amount: err.response.data.platformFee
        });
      } else {
        toast.error(err.response?.data?.message || `Failed to ${status} request`);
      }
      return false;
    } finally {
      setUpdatingRequest(null);
    }
  };

  const handleProgressUpdate = async (requestId, progressStatus) => {
    setUpdatingRequest(requestId);
    try {
      const { data } = await api.put(`/contact/${requestId}/status`, { progressStatus });
      setRequests((currentRequests) => currentRequests.map((request) => (
        request._id === requestId ? { ...request, ...data.connection } : request
      )));
      toast.success(`Status updated to ${progressStatus.replaceAll('_', ' ')}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update request status');
    } finally {
      setUpdatingRequest(null);
    }
  };

  const rejectRequest = async (event) => {
    event.preventDefault();
    const updated = await handleRequestStatus(rejectionRequest._id, 'rejected', {
      rejectionReason: rejectionForm.reason,
      suggestedSlot: rejectionForm.day ? {
        day: rejectionForm.day,
        start: rejectionForm.start,
        end: rejectionForm.end
      } : undefined
    });
    if (updated) {
      setRejectionRequest(null);
      setRejectionForm({ reason: '', day: '', start: '', end: '' });
    }
  };

  const payPlatformFee = async (requestId) => {
    setUpdatingRequest(requestId);
    try {
      await loadRazorpay();
      const { data } = await api.post(`/contact/${requestId}/platform-fee/order`);
      if (!data.paymentRequired) {
        setPaymentRequest(null);
        return;
      }

      const payment = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'TutorConnect',
        description: 'Platform fee for accepting an additional student',
        order_id: data.order.id,
        prefill: { name: user.name, email: user.email, contact: user.phone || '' },
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          try {
            const verification = await api.post(`/contact/${requestId}/platform-fee/verify`, response);
            setPaymentRequest(null);
            setRequests((currentRequests) =>
              currentRequests.map((request) =>
                request._id === requestId
                  ? { ...request, ...verification.data.connection, platformFeePaid: true }
                  : request
              )
            );
            toast.success('Razorpay test payment verified. You can now accept this request.');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setUpdatingRequest(null);
          }
        },
        modal: { ondismiss: () => setUpdatingRequest(null) }
      });
      payment.on('payment.failed', () => {
        setUpdatingRequest(null);
        toast.error('Razorpay payment failed. Please try again.');
      });
      payment.open();
    } catch (err) {
      setUpdatingRequest(null);
      toast.error(err.response?.data?.message || err.message || 'Could not start Razorpay payment');
    }
  };

  const openProfileEditor = () => {
    setProfileForm({
      name: user.name || '',
      phone: user.phone || '',
      degree: user.degree || '',
      experience: user.experience || 0,
      feePerHour: user.feePerHour || 0,
      availability: user.availability || '',
      availabilitySlots: user.availabilitySlots?.length ? user.availabilitySlots : [{ day: 'Mon', start: '5 PM', end: '7 PM' }],
      bio: user.bio || '',
      profileImage: user.profileImage || ''
      ,demoVideo: user.demoVideo || ''
      ,identityDocument: user.identityDocument || ''
      ,identityDocumentName: user.identityDocumentName || ''
    });
    setEditingProfile(true);
  };

  const handleIdentityDocumentChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const documentData = await imageFileToDataUrl(file);
      setProfileForm((current) => ({ ...current, identityDocument: documentData, identityDocumentName: file.name }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openChat = async (connection) => {
    setChatConnection(connection);
    setChatLoading(true);
    try {
      const { data } = await api.get(`/chat/${connection._id}`);
      setChatMessages(data.messages || []);
    } catch (err) {
      setChatConnection(null);
      toast.error(err.response?.data?.message || 'Chat is not available yet');
    } finally {
      setChatLoading(false);
    }
  };

  const sendChat = async (event) => {
    event.preventDefault();
    if (!chatText.trim() || !chatConnection) return;
    try {
      const { data } = await api.post(`/chat/${chatConnection._id}`, { text: chatText });
      setChatMessages((current) => [...current, data.message]);
      setChatText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send message');
    }
  };

  const generateReceipt = async (request) => {
    setReceiptLoading(request._id);
    try {
      const { data } = await api.post(`/contact/${request._id}/receipt`, { hours: 1 });
      setRequests((current) => current.map((item) => item._id === request._id ? { ...item, receipt: data.receipt } : item));
      toast.success(`Receipt ${data.receipt.receiptNumber} generated`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate receipt');
    } finally {
      setReceiptLoading(null);
    }
  };

  const printReceipt = (request) => {
    if (!request.receipt) return;
    const receiptWindow = window.open('', '_blank', 'width=500,height=600');
    receiptWindow.document.write(`<html><head><title>${request.receipt.receiptNumber}</title></head><body style="font-family:Arial;padding:24px"><h2>TutorConnect Payment Slip</h2><p>Receipt: ${request.receipt.receiptNumber}</p><p>Teacher: ${request.teacher?.name || user.name}</p><p>Amount: ₹${request.receipt.amount}</p><p>Fee: ₹${request.receipt.feePerHour}/hour × ${request.receipt.hours} hour</p><p>Date: ${new Date(request.receipt.generatedAt).toLocaleString()}</p><p>This is a record-only receipt. No online payment was processed.</p><script>window.print()</script></body></html>`);
    receiptWindow.document.close();
  };

  const handleDemoVideoChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const video = await mediaFileToDataUrl(file);
      setProfileForm((current) => ({ ...current, demoVideo: video }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const image = await imageFileToDataUrl(file);
      setProfileForm((current) => ({ ...current, profileImage: image }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updates = {
        name: profileForm.name,
        phone: profileForm.phone,
        profileImage: profileForm.profileImage
      };

      if (isTeacher) {
        updates.demoVideo = profileForm.demoVideo;
        updates.identityDocument = profileForm.identityDocument;
        updates.identityDocumentName = profileForm.identityDocumentName;
        updates.degree = profileForm.degree;
        updates.experience = Number(profileForm.experience) || 0;
        updates.feePerHour = Number(profileForm.feePerHour) || 0;
        updates.availability = profileForm.availability;
        updates.availabilitySlots = profileForm.availabilitySlots;
        updates.bio = profileForm.bio;
      }

      const { data } = await api.put('/auth/profile', updates);
      updateUser(data.user);
      setEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) return null;

  const isTeacher = user.role === 'teacher';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
        {isTeacher ? 'Teacher Dashboard' : 'Student Dashboard'}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Welcome back, {user.name}!
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="flex flex-col items-center text-center">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-20 h-20 rounded-2xl object-cover mb-3" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-3xl font-bold text-primary-600 mb-3">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <h2 className="text-xl font-bold">{user.name}</h2>
              <span className="mt-1 text-xs px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 capitalize font-medium">
                {user.role}
              </span>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <HiOutlineMail className="w-4 h-4 shrink-0" />
                {user.email}
              </p>
              {user.phone && (
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <HiOutlinePhone className="w-4 h-4 shrink-0" />
                  {user.phone}
                </p>
              )}
              {isTeacher && user.degree && (
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <HiOutlineAcademicCap className="w-4 h-4 shrink-0" />
                  {user.degree}
                </p>
              )}
              {isTeacher && user.feePerHour && (
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <HiOutlineCurrencyRupee className="w-4 h-4 shrink-0" />
                  ₹{user.feePerHour}/hour
                </p>
              )}
              {isTeacher && user.experience && (
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <HiOutlineClock className="w-4 h-4 shrink-0" />
                  {user.experience}+ years experience
                </p>
              )}
              {isTeacher && user.location && (
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <HiOutlineLocationMarker className="w-4 h-4 shrink-0" />
                  {[user.location.city, user.location.district, user.location.state]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {isTeacher && user.identityVerified && (
                <p className="flex items-center gap-2 text-green-700"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">✓</span> Verified Teacher</p>
              )}
            </div>

            {isTeacher && user.subjects?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                {user.subjects.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            <button
              className="btn-secondary w-full mt-6 flex items-center justify-center gap-2 text-sm"
              onClick={openProfileEditor}
            >
              <HiOutlinePencil className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {!isTeacher && (
            <div className="card border-primary-200 bg-primary-50/60 p-6 dark:border-primary-900 dark:bg-primary-950/20">
              <h3 className="text-lg font-bold text-primary-900 dark:text-primary-200">Find a group for your tuition</h3>
              <p className="mt-1 text-sm text-primary-800 dark:text-primary-300">Tell us what you need. We will match you with up to 2 nearby students.</p>
              <form onSubmit={createStudentPool} className="mt-4 grid gap-3 sm:grid-cols-2">
                <input required className="input-field" placeholder="Subject, e.g. Maths" value={poolForm.subject} onChange={(event) => setPoolForm({ ...poolForm, subject: event.target.value })} />
                <input required className="input-field" placeholder="Class, e.g. 10th" value={poolForm.studentClass} onChange={(event) => setPoolForm({ ...poolForm, studentClass: event.target.value })} />
                <input required className="input-field" placeholder="Area, e.g. Gomti Nagar" value={poolForm.area} onChange={(event) => setPoolForm({ ...poolForm, area: event.target.value })} />
                <button type="submit" disabled={creatingPool} className="btn-primary disabled:opacity-50">{creatingPool ? 'Finding students...' : 'Find or create pool'}</button>
              </form>
              <p className="mt-2 text-xs text-gray-500">Using Gomti Nagar coordinates for this demo. Teacher profiles can provide exact map coordinates.</p>
            </div>
          )}
          {pools.length > 0 && (
            <div className="card border-emerald-200 bg-emerald-50/70 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">Group tuition opportunities</h3>
              <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-400">Students with the same learning goal can share one teacher and split the fee.</p>
              <div className="mt-4 space-y-3">
                {pools.map((pool) => <PoolCard key={pool._id} pool={pool} teacherView={isTeacher} onUpdate={(updated) => setPools((current) => updated ? current.map((item) => item._id === updated._id ? updated : item) : current.filter((item) => item._id !== pool._id))} />)}
              </div>
            </div>
          )}
          {isTeacher ? (
            <>
              {/* Connection requests */}
              <div className="card p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <HiOutlineInbox className="w-5 h-5 text-primary-600" />
                  Connection Requests
                </h3>
                {loadingRequests ? (
                  <p className="text-gray-500 text-sm">Loading...</p>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <HiOutlineInbox className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p>No connection requests yet.</p>
                    <p className="text-sm mt-1">
                      Students who contact you will appear here. Make sure your profile is complete!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req) => (
                      <div
                        key={req._id}
                        className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{req.student?.name || 'Student'}</p>
                            <p className="text-sm text-gray-500">{req.student?.email}</p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-xs px-2 py-1 rounded-full capitalize ${
                                req.status === 'accepted'
                                  ? 'bg-green-100 text-green-700'
                                  : req.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {req.status || 'pending'}
                            </span>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{req.message}</p>
                        {req.rejectionReason && (
                          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                            <strong>Reason:</strong> {req.rejectionReason}
                            {req.suggestedSlot?.day && <p className="mt-1"><strong>Suggested time:</strong> {req.suggestedSlot.day} {req.suggestedSlot.start} - {req.suggestedSlot.end}</p>}
                          </div>
                        )}
                        {req.studentPhone && (
                          <p className="mt-1 text-sm text-primary-600">Phone: {req.studentPhone}</p>
                        )}
                        {req.status === 'pending' && (
                          <div className="flex gap-2 mt-4">
                            {req.platformFeePaid ? (
                              <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 self-center">
                                Platform fee paid
                              </p>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleRequestStatus(req._id, 'accepted')}
                              disabled={updatingRequest === req._id}
                              className="btn-primary flex items-center gap-1.5 text-sm disabled:opacity-50"
                            >
                              <HiOutlineCheck className="w-4 h-4" />
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectionRequest(req)}
                              disabled={updatingRequest === req._id}
                              className="btn-secondary flex items-center gap-1.5 text-sm text-red-600 disabled:opacity-50"
                            >
                              <HiOutlineX className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        )}
                        {req.status === 'accepted' && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => openChat(req)} className="btn-secondary flex items-center gap-1.5 text-sm"><HiOutlineChatAlt2 className="h-4 w-4" /> Chat</button>
                            <button type="button" onClick={() => req.receipt ? printReceipt(req) : generateReceipt(req)} disabled={receiptLoading === req._id} className="btn-secondary flex items-center gap-1.5 text-sm"><HiOutlineDocumentText className="h-4 w-4" /> {receiptLoading === req._id ? 'Creating...' : req.receipt ? 'Print receipt' : 'Payment slip'}</button>
                            {req.progressStatus === 'accepted' && (
                              <button type="button" onClick={() => handleProgressUpdate(req._id, 'demo_done')} disabled={updatingRequest === req._id} className="btn-secondary text-sm disabled:opacity-50">Mark Demo Done</button>
                            )}
                            {req.progressStatus === 'demo_done' && (
                              <button type="button" onClick={() => handleProgressUpdate(req._id, 'classes_started')} disabled={updatingRequest === req._id} className="btn-primary text-sm disabled:opacity-50">Mark Classes Started</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="card p-6 bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800">
                <h3 className="font-bold text-primary-800 dark:text-primary-300 mb-2">Tips to get more students</h3>
                <ul className="text-sm text-primary-700 dark:text-primary-400 space-y-1 list-disc list-inside">
                  <li>Keep your bio and availability up to date</li>
                  <li>Respond quickly to connection requests</li>
                  <li>Add a clear fee and subjects list</li>
                  <li>Encourage happy students to leave reviews</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Student actions */}
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Link
                    to="/teachers"
                    className="p-5 rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition text-center"
                  >
                    <HiOutlineAcademicCap className="w-8 h-8 mx-auto text-primary-600 mb-2" />
                    <p className="font-semibold">Find Teachers</p>
                    <p className="text-sm text-gray-500 mt-1">Browse & filter tutors near you</p>
                  </Link>
                  <div className="p-5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center opacity-70">
                    <HiOutlineUser className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="font-semibold">Saved Teachers</p>
                    <p className="text-sm text-gray-500 mt-1">Coming soon</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-bold mb-2">Your Activity</h3>
                {loadingRequests ? (
                  <p className="text-gray-500 text-sm">Loading requests...</p>
                ) : requests.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    You have not sent any connection requests yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {requests.map((request) => (
                      <div
                        key={request._id}
                        className="p-4 rounded-lg border border-orange-100 dark:border-gray-700 bg-orange-50/50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {request.teacher?.profileImage ? (
                              <img
                                src={request.teacher.profileImage}
                                alt={request.teacher.name}
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 font-bold shrink-0">
                                {request.teacher?.name?.charAt(0)?.toUpperCase() || 'T'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold truncate">
                                {request.teacher?.name || 'Teacher'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {request.teacher?.email}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full capitalize shrink-0 ${
                              request.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {request.status || 'pending'}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                          {request.message}
                        </p>
                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                            <strong>Teacher's reason:</strong> {request.rejectionReason}
                            {request.suggestedSlot?.day && <p className="mt-1"><strong>Suggested time:</strong> {request.suggestedSlot.day} {request.suggestedSlot.start} - {request.suggestedSlot.end}</p>}
                          </div>
                        )}
                        <div className="mt-4 overflow-x-auto">
                          <div className="flex min-w-[440px] items-start">
                            {PROGRESS_STEPS.map(([step, label], index) => {
                              const currentStep = request.progressStatus || (request.status === 'accepted' ? 'accepted' : 'request_sent');
                              const currentIndex = PROGRESS_STEPS.findIndex(([value]) => value === currentStep);
                              const complete = index === 0 || (request.status !== 'rejected' && index <= currentIndex);
                              return (
                                <div key={step} className="flex flex-1 items-start">
                                  <div className="flex flex-col items-center text-center">
                                    <div className={`h-7 w-7 rounded-full border-2 text-xs font-bold leading-6 ${complete ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 text-gray-400'}`}>{index + 1}</div>
                                    <span className={`mt-1 text-[11px] ${complete ? 'font-semibold text-primary-700' : 'text-gray-400'}`}>{label}</span>
                                  </div>
                                  {index < PROGRESS_STEPS.length - 1 && <div className={`mt-3 h-0.5 flex-1 ${complete && index < currentIndex ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {request.status === 'accepted' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => openChat(request)} className="btn-primary flex items-center gap-1.5 text-sm"><HiOutlineChatAlt2 className="h-4 w-4" /> Open private chat</button>
                            <button type="button" onClick={() => request.receipt ? printReceipt(request) : generateReceipt(request)} disabled={receiptLoading === request._id} className="btn-secondary flex items-center gap-1.5 text-sm"><HiOutlineDocumentText className="h-4 w-4" /> {receiptLoading === request._id ? 'Creating...' : request.receipt ? 'Print payment slip' : 'Generate payment slip'}</button>
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-400">
                          Sent: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {rejectionRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form onSubmit={rejectRequest} className="card w-full max-w-md p-6">
            <h2 className="text-xl font-bold">Reject request</h2>
            <p className="mt-1 text-sm text-gray-500">Give the student a helpful reason and optionally suggest another time.</p>
            <label className="mt-5 block text-sm font-medium">Reason *</label>
            <textarea required maxLength={500} rows={3} className="input-field mt-1 resize-none" value={rejectionForm.reason} onChange={(event) => setRejectionForm({ ...rejectionForm, reason: event.target.value })} placeholder="I am unavailable for this subject at the requested time." />
            <label className="mt-4 block text-sm font-medium">Suggest another time (optional)</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <select className="input-field" value={rejectionForm.day} onChange={(event) => setRejectionForm({ ...rejectionForm, day: event.target.value })}>
                <option value="">Day</option>
                {DAYS.map((day) => <option key={day}>{day}</option>)}
              </select>
              <input className="input-field" placeholder="5 PM" value={rejectionForm.start} onChange={(event) => setRejectionForm({ ...rejectionForm, start: event.target.value })} />
              <input className="input-field" placeholder="7 PM" value={rejectionForm.end} onChange={(event) => setRejectionForm({ ...rejectionForm, end: event.target.value })} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setRejectionRequest(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={updatingRequest === rejectionRequest._id}>{updatingRequest === rejectionRequest._id ? 'Sending...' : 'Reject request'}</button>
            </div>
          </form>
        </div>
      )}

      {chatConnection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="card flex max-h-[80vh] w-full max-w-lg flex-col p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div><h2 className="text-xl font-bold">Private chat</h2><p className="text-sm text-gray-500">Only available after acceptance</p></div>
              <button type="button" onClick={() => setChatConnection(null)} className="text-2xl text-gray-500" aria-label="Close chat"><HiOutlineX /></button>
            </div>
            <div className="my-4 min-h-[220px] flex-1 space-y-2 overflow-y-auto">
              {chatLoading ? <p className="text-sm text-gray-500">Loading messages...</p> : chatMessages.length === 0 ? <p className="text-sm text-gray-500">Start the conversation without sharing your phone number.</p> : chatMessages.map((message) => (
                <div key={message._id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${message.sender?._id === user.id ? 'ml-auto bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}><p>{message.text}</p><span className="text-[10px] opacity-70">{message.sender?.name}</span></div>
              ))}
            </div>
            <form onSubmit={sendChat} className="flex gap-2">
              <input className="input-field" value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Write a message" maxLength={1000} />
              <button type="submit" className="btn-primary">Send</button>
            </form>
          </div>
        </div>
      )}

      {paymentRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-xl font-bold">Platform fee required</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              You have already accepted one student. Pay the platform fee before accepting another request.
            </p>
            <p className="mt-4 text-3xl font-extrabold text-primary-700">₹{paymentRequest.amount}</p>
            <p className="text-xs text-gray-500 mt-1">Razorpay Test Mode is enabled. No real money will be charged.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setPaymentRequest(null)} className="btn-secondary" disabled={updatingRequest === paymentRequest.requestId}>
                Cancel
              </button>
              <button type="button" onClick={() => payPlatformFee(paymentRequest.requestId)} className="btn-primary" disabled={updatingRequest === paymentRequest.requestId}>
                {updatingRequest === paymentRequest.requestId ? 'Opening Razorpay...' : 'Pay with Razorpay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <form onSubmit={saveProfile} className="card w-full max-w-lg max-h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button type="button" onClick={() => setEditingProfile(false)} className="text-gray-500 hover:text-gray-800 text-2xl" aria-label="Close">
                <HiOutlineX />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Profile Photo</label>
                <input type="file" accept="image/*" onChange={handleProfileImageChange} className="input-field py-2" />
                {profileForm.profileImage && (
                  <img src={profileForm.profileImage} alt="Profile preview" className="w-16 h-16 rounded-full object-cover mt-2" />
                )}
              </div>
              {isTeacher && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Teaching Demo Video</label>
                  <input type="file" accept="video/*" onChange={handleDemoVideoChange} className="input-field py-2" />
                  <p className="text-xs text-gray-500 mt-1">MP4 or WebM, maximum 6 MB.</p>
                  {profileForm.demoVideo && <p className="text-xs text-green-600 mt-1">Video ready to save.</p>}
                </div>
              )}
              {isTeacher && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Government ID for verification</label>
                  <input type="file" accept="image/*" onChange={handleIdentityDocumentChange} className="input-field py-2" />
                  <p className="text-xs text-gray-500 mt-1">Upload Aadhaar or another ID. It will be reviewed before the badge appears.</p>
                  {profileForm.identityDocumentName && <p className="text-xs text-green-600 mt-1">{profileForm.identityDocumentName} ready to submit.</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input className="input-field" value={profileForm.name || ''} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone</label>
                <input className="input-field" value={profileForm.phone || ''} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} />
              </div>
              {isTeacher && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Degree / Qualification</label>
                    <input className="input-field" value={profileForm.degree || ''} onChange={(event) => setProfileForm({ ...profileForm, degree: event.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Experience</label>
                      <input type="number" min="0" className="input-field" value={profileForm.experience ?? ''} onChange={(event) => setProfileForm({ ...profileForm, experience: event.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Fee / Hour</label>
                      <input type="number" min="0" className="input-field" value={profileForm.feePerHour ?? ''} onChange={(event) => setProfileForm({ ...profileForm, feePerHour: event.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Availability</label>
                    <input className="input-field" value={profileForm.availability || ''} onChange={(event) => setProfileForm({ ...profileForm, availability: event.target.value })} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium">Bookable weekly slots</label>
                      <button type="button" className="text-sm font-semibold text-primary-600" onClick={() => setProfileForm({ ...profileForm, availabilitySlots: [...(profileForm.availabilitySlots || []), { day: 'Mon', start: '5 PM', end: '7 PM' }] })}>+ Add slot</button>
                    </div>
                    <div className="space-y-2">
                      {(profileForm.availabilitySlots || []).map((slot, index) => (
                        <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                          <select className="input-field" value={slot.day} onChange={(event) => setProfileForm({ ...profileForm, availabilitySlots: profileForm.availabilitySlots.map((item, itemIndex) => itemIndex === index ? { ...item, day: event.target.value } : item) })}>
                            {DAYS.map((day) => <option key={day}>{day}</option>)}
                          </select>
                          <input className="input-field" placeholder="5 PM" value={slot.start} onChange={(event) => setProfileForm({ ...profileForm, availabilitySlots: profileForm.availabilitySlots.map((item, itemIndex) => itemIndex === index ? { ...item, start: event.target.value } : item) })} />
                          <input className="input-field" placeholder="7 PM" value={slot.end} onChange={(event) => setProfileForm({ ...profileForm, availabilitySlots: profileForm.availabilitySlots.map((item, itemIndex) => itemIndex === index ? { ...item, end: event.target.value } : item) })} />
                          <button type="button" aria-label="Remove slot" className="px-2 text-gray-500" onClick={() => setProfileForm({ ...profileForm, availabilitySlots: profileForm.availabilitySlots.filter((_, itemIndex) => itemIndex !== index) })}><HiOutlineX /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Short Bio</label>
                    <textarea rows={3} className="input-field resize-none" value={profileForm.bio || ''} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setEditingProfile(false)} className="btn-secondary" disabled={savingProfile}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;










// import { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import axios from '../api/axios';
// import { Link } from 'react-router-dom';
// import {
//   FiUser, FiMail, FiPhone, FiMapPin, FiBook, FiClock,
//   FiDollarSign, FiStar, FiCheck, FiX, FiMessageSquare, FiInbox
// } from 'react-icons/fi';

// const Dashboard = () => {
//   const { user, token } = useAuth();
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(null);
//   const [message, setMessage] = useState({ type: '', text: '' });

//   // Fetch connection requests
//   const fetchRequests = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get('/contact/my-requests', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setRequests(res.data.connections || []);
//     } catch (err) {
//       console.error('Failed to load requests:', err);
//       setMessage({ type: 'error', text: 'Failed to load requests' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (token) fetchRequests();
//   }, [token]);

//   // Teacher accepts / rejects request
//   const handleStatus = async (id, status) => {
//     try {
//       setActionLoading(id);
//       await axios.put(
//         `/contact/${id}/status`,
//         { status },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setMessage({
//         type: 'success',
//         text: `Request ${status} successfully`
//       });
//       fetchRequests(); // refresh list
//     } catch (err) {
//       setMessage({
//         type: 'error',
//         text: err.response?.data?.message || 'Action failed'
//       });
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   if (!user) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p>Please login first</p>
//       </div>
//     );
//   }

//   const isTeacher = user.role === 'teacher';

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
//       <div className="max-w-5xl mx-auto">

//         {/* Header */}
//         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-8">
//           <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
//             Welcome, {user.name} 👋
//           </h1>
//           <p className="text-gray-500 dark:text-gray-400 mt-1 capitalize">
//             {user.role} Dashboard
//           </p>
//         </div>

//         {/* Alert Message */}
//         {message.text && (
//           <div
//             className={`mb-6 p-4 rounded-lg ${
//               message.type === 'success'
//                 ? 'bg-green-100 text-green-800'
//                 : 'bg-red-100 text-red-800'
//             }`}
//           >
//             {message.text}
//           </div>
//         )}

//         <div className="grid md:grid-cols-3 gap-6">

//           {/* Left - Profile Card */}
//           <div className="md:col-span-1">
//             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 sticky top-6">
//               <div className="flex flex-col items-center text-center">
//                 <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-3xl font-bold text-indigo-600 mb-4">
//                   {user.name?.charAt(0).toUpperCase()}
//                 </div>
//                 <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
//                   {user.name}
//                 </h2>
//                 <p className="text-sm text-gray-500 capitalize">{user.role}</p>
//               </div>

//               <div className="mt-6 space-y-3 text-sm">
//                 <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
//                   <FiMail className="text-indigo-500" />
//                   <span className="truncate">{user.email}</span>
//                 </div>
//                 {user.phone && (
//                   <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
//                     <FiPhone className="text-indigo-500" />
//                     <span>{user.phone}</span>
//                   </div>
//                 )}

//                 {isTeacher && (
//                   <>
//                     {user.degree && (
//                       <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
//                         <FiBook className="text-indigo-500" />
//                         <span>{user.degree}</span>
//                       </div>
//                     )}
//                     {user.feePerHour && (
//                       <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
//                         <FiDollarSign className="text-indigo-500" />
//                         <span>₹{user.feePerHour} / hour</span>
//                       </div>
//                     )}
//                     {user.experience > 0 && (
//                       <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
//                         <FiClock className="text-indigo-500" />
//                         <span>{user.experience} years experience</span>
//                       </div>
//                     )}
//                     {user.location?.city && (
//                       <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
//                         <FiMapPin className="text-indigo-500" />
//                         <span>
//                           {user.location.city}
//                           {user.location.district ? `, ${user.location.district}` : ''}
//                           {user.location.state ? `, ${user.location.state}` : ''}
//                         </span>
//                       </div>
//                     )}
//                     {user.subjects?.length > 0 && (
//                       <div className="pt-2">
//                         <p className="text-xs text-gray-500 mb-2">Subjects</p>
//                         <div className="flex flex-wrap gap-2">
//                           {user.subjects.map((sub) => (
//                             <span
//                               key={sub}
//                               className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs rounded-full"
//                             >
//                               {sub}
//                             </span>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                     {user.averageRating > 0 && (
//                       <div className="flex items-center gap-2 pt-2">
//                         <FiStar className="text-yellow-500" />
//                         <span className="font-medium">{user.averageRating}</span>
//                         <span className="text-gray-500 text-xs">
//                           ({user.totalReviews || 0} reviews)
//                         </span>
//                       </div>
//                     )}
//                   </>
//                 )}
//               </div>

//               <Link
//                 to="/teachers"
//                 className="mt-6 block w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
//               >
//                 Browse Teachers
//               </Link>
//             </div>
//           </div>

//           {/* Right - Requests Section */}
//           <div className="md:col-span-2">
//             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
//               <div className="flex items-center gap-3 mb-6">
//                 <FiInbox className="text-2xl text-indigo-600" />
//                 <h2 className="text-xl font-bold text-gray-800 dark:text-white">
//                   {isTeacher ? 'Incoming Connection Requests' : 'My Connection Requests'}
//                 </h2>
//               </div>

//               {loading ? (
//                 <div className="text-center py-12 text-gray-500">Loading requests...</div>
//               ) : requests.length === 0 ? (
//                 <div className="text-center py-12">
//                   <FiMessageSquare className="mx-auto text-4xl text-gray-300 mb-3" />
//                   <p className="text-gray-500">
//                     {isTeacher
//                       ? 'No connection requests yet. Students will appear here when they contact you.'
//                       : 'You have not sent any connection requests yet.'}
//                   </p>
//                   {!isTeacher && (
//                     <Link
//                       to="/teachers"
//                       className="inline-block mt-4 text-indigo-600 hover:underline font-medium"
//                     >
//                       Find Teachers →
//                     </Link>
//                   )}
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {requests.map((req) => (
//                     <div
//                       key={req._id}
//                       className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition"
//                     >
//                       {/* Teacher view */}
//                       {isTeacher ? (
//                         <>
//                           <div className="flex justify-between items-start gap-4">
//                             <div>
//                               <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
//                                 {req.student?.name || 'Student'}
//                               </h3>
//                               <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
//                                 <FiMail /> {req.student?.email}
//                               </p>
//                               {req.studentPhone && (
//                                 <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
//                                   <FiPhone /> {req.studentPhone}
//                                 </p>
//                               )}
//                             </div>
//                             <span
//                               className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
//                                 req.status === 'pending'
//                                   ? 'bg-yellow-100 text-yellow-800'
//                                   : req.status === 'accepted'
//                                   ? 'bg-green-100 text-green-800'
//                                   : 'bg-red-100 text-red-800'
//                               }`}
//                             >
//                               {req.status}
//                             </span>
//                           </div>

//                           <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300">
//                             <p className="font-medium text-xs text-gray-500 mb-1">Message:</p>
//                             {req.message}
//                           </div>

//                           <p className="text-xs text-gray-400 mt-2">
//                             Received: {new Date(req.createdAt).toLocaleString()}
//                           </p>

//                           {req.status === 'pending' && (
//                             <div className="flex gap-3 mt-4">
//                               <button
//                                 onClick={() => handleStatus(req._id, 'accepted')}
//                                 disabled={actionLoading === req._id}
//                                 className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
//                               >
//                                 <FiCheck /> Accept
//                               </button>
//                               <button
//                                 onClick={() => handleStatus(req._id, 'rejected')}
//                                 disabled={actionLoading === req._id}
//                                 className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
//                               >
//                                 <FiX /> Reject
//                               </button>
//                             </div>
//                           )}
//                         </>
//                       ) : (
//                         /* Student view */
//                         <>
//                           <div className="flex justify-between items-start gap-4">
//                             <div>
//                               <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
//                                 {req.teacher?.name || 'Teacher'}
//                               </h3>
//                               <p className="text-sm text-gray-500 mt-1">
//                                 {req.teacher?.subjects?.join(', ')}
//                               </p>
//                               {req.teacher?.feePerHour && (
//                                 <p className="text-sm text-indigo-600 mt-1">
//                                   ₹{req.teacher.feePerHour}/hr
//                                 </p>
//                               )}
//                             </div>
//                             <span
//                               className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
//                                 req.status === 'pending'
//                                   ? 'bg-yellow-100 text-yellow-800'
//                                   : req.status === 'accepted'
//                                   ? 'bg-green-100 text-green-800'
//                                   : 'bg-red-100 text-red-800'
//                               }`}
//                             >
//                               {req.status}
//                             </span>
//                           </div>

//                           <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
//                             <p className="font-medium text-xs text-gray-500 mb-1">Your message:</p>
//                             {req.message}
//                           </div>

//                           <p className="text-xs text-gray-400 mt-2">
//                             Sent: {new Date(req.createdAt).toLocaleString()}
//                           </p>

//                           {req.status === 'accepted' && req.teacher?.email && (
//                             <p className="mt-3 text-sm text-green-700 bg-green-50 p-2 rounded">
//                               ✅ Accepted! You can contact the teacher at:{' '}
//                               <strong>{req.teacher.email}</strong>
//                             </p>
//                           )}
//                         </>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;