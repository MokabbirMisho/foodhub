import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import AddressForm from '../../components/customer/AddressForm';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import {
  addMyAddress,
  deleteMyAddress,
  getMyAddresses,
  getMyProfile,
  setDefaultAddress,
  updateMyAddress,
  updateMyProfile,
} from '../../services/customerProfileService';

const quickActions = [
  {
    description: 'Discover approved restaurants and explore available menus.',
    label: 'Browse Restaurants',
    to: '/restaurants',
  },
  {
    description: 'Review selected meals and continue to checkout.',
    label: 'Cart',
    to: '/cart',
  },
  {
    description: 'Follow active orders and revisit your order history.',
    label: 'My Orders',
    to: '/my-orders',
  },
];

function CustomerAccountPage() {
  const location = useLocation();
  const { getCartCount } = useCart();
  const { updateCurrentUser, user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    avatar: '',
  });
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (location.state?.section === 'addresses') {
      setActiveTab('addresses');
      setIsAddingAddress(Boolean(location.state.addAddress));
    }
  }, [location.state]);

  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        setError('');
        setIsLoading(true);
        const [profileResponse, addressesResponse] = await Promise.all([
          getMyProfile(),
          getMyAddresses(),
        ]);
        const customer = profileResponse.data.user;

        setProfile(customer);
        setProfileForm({
          name: customer.name || '',
          phone: customer.phone || '',
          avatar: customer.avatar || '',
        });
        setAddresses(addressesResponse.data.addresses || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  const handleProfileChange = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    try {
      setError('');
      setSuccessMessage('');
      setIsSavingProfile(true);
      const response = await updateMyProfile(profileForm);
      const updatedProfile = response.data.user;

      setProfile(updatedProfile);
      updateCurrentUser(updatedProfile);
      setSuccessMessage('Profile updated successfully');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddAddress = async (data) => {
    const response = await addMyAddress(data);
    setAddresses(response.data.addresses || []);
    setIsAddingAddress(false);
    setSuccessMessage('Address added successfully');
  };

  const handleUpdateAddress = async (data) => {
    const response = await updateMyAddress(editingAddress._id, data);
    setAddresses(response.data.addresses || []);
    setEditingAddress(null);
    setSuccessMessage('Address updated successfully');
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      setError('');
      const response = await deleteMyAddress(addressId);
      setAddresses(response.data.addresses || []);
      setSuccessMessage('Address deleted successfully');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      setError('');
      const response = await setDefaultAddress(addressId);
      setAddresses(response.data.addresses || []);
      setSuccessMessage('Default address updated successfully');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-orange-50 p-6 text-slate-700">
        Loading customer profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-6xl space-y-6">
        <BackButton />

        <header className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Customer Account
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            Welcome, {profile?.name || user?.name}
          </h1>
          <p className="mt-3 text-slate-700">
            Manage your profile and delivery addresses.
          </p>
        </header>

        <nav className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
          {['overview', 'profile', 'addresses'].map((tab) => (
            <button
              className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize ${
                activeTab === tab
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-700 hover:bg-orange-50'
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </nav>

        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
        )}
        {successMessage && (
          <p className="rounded-xl bg-green-50 p-4 text-green-700">
            {successMessage}
          </p>
        )}

        {activeTab === 'overview' && (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              {quickActions.map((action) => (
                <article
                  className="rounded-xl bg-white p-6 shadow-sm"
                  key={action.to}
                >
                  <h2 className="text-xl font-bold">
                    {action.label}
                    {action.to === '/cart' && getCartCount() > 0
                      ? ` (${getCartCount()})`
                      : ''}
                  </h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                    {action.description}
                  </p>
                  <Link
                    className="mt-5 inline-flex rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
                    to={action.to}
                  >
                    Open
                  </Link>
                </article>
              ))}
            </div>

            <button
              className="w-full rounded-xl bg-white p-6 text-left shadow-sm hover:bg-orange-50"
              onClick={() => setActiveTab('addresses')}
              type="button"
            >
              <span className="text-xl font-bold">Saved Addresses</span>
              <span className="mt-2 block text-sm text-slate-600">
                {addresses.length} saved delivery address
                {addresses.length === 1 ? '' : 'es'}
              </span>
            </button>
          </>
        )}

        {activeTab === 'profile' && (
          <form
            className="rounded-xl bg-white p-6 shadow-sm"
            onSubmit={handleProfileSubmit}
          >
            <h2 className="text-2xl font-bold">Profile Information</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
                  name="name"
                  onChange={handleProfileChange}
                  required
                  value={profileForm.name}
                />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Phone</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
                  name="phone"
                  onChange={handleProfileChange}
                  value={profileForm.phone}
                />
              </label>
              <label className="md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Avatar URL
                </span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
                  name="avatar"
                  onChange={handleProfileChange}
                  value={profileForm.avatar}
                />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
                  readOnly
                  value={profile?.email || ''}
                />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Role</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
                  readOnly
                  value={profile?.role || ''}
                />
              </label>
            </div>
            <button
              className="mt-6 rounded-md bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
              disabled={isSavingProfile}
              type="submit"
            >
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}

        {activeTab === 'addresses' && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Saved Addresses</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Choose a default address for faster checkout.
                </p>
              </div>
              {!isAddingAddress && !editingAddress && (
                <button
                  className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
                  onClick={() => setIsAddingAddress(true)}
                  type="button"
                >
                  Add New Address
                </button>
              )}
            </div>

            {isAddingAddress && (
              <AddressForm
                onCancel={() => setIsAddingAddress(false)}
                onSubmit={handleAddAddress}
              />
            )}
            {editingAddress && (
              <AddressForm
                initialData={editingAddress}
                onCancel={() => setEditingAddress(null)}
                onSubmit={handleUpdateAddress}
              />
            )}

            {!isAddingAddress && !editingAddress && addresses.length === 0 && (
              <p className="rounded-xl bg-white p-6 text-slate-700 shadow-sm">
                No saved addresses yet.
              </p>
            )}

            {!isAddingAddress && !editingAddress && addresses.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((address) => (
                  <article
                    className="rounded-xl bg-white p-5 shadow-sm"
                    key={address._id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold">{address.label}</h3>
                      {address.isDefault && (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-sm leading-6 text-slate-700">
                      <p>{address.fullName || profile?.name}</p>
                      <p>{address.phone || profile?.phone}</p>
                      <p>{address.street}</p>
                      <p>
                        {address.postalCode} {address.city}
                      </p>
                      <p>{address.country}</p>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-indigo-700">
                      {Number.isFinite(address.location?.lat) &&
                      Number.isFinite(address.location?.lng)
                        ? 'Map location available'
                        : 'Written address only'}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        className="rounded-md border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                        onClick={() => setEditingAddress(address)}
                        type="button"
                      >
                        Edit
                      </button>
                      {!address.isDefault && (
                        <button
                          className="rounded-md border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                          onClick={() => handleSetDefault(address._id)}
                          type="button"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteAddress(address._id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

export default CustomerAccountPage;
