import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import AddressForm from '../../components/customer/AddressForm';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import {
  addMyAddress,
  changeMyPassword,
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
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
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

  const handlePasswordChange = (event) => {
    setPasswordForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setError('All password fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      setIsSavingPassword(true);
      const response = await changeMyPassword(passwordForm);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSuccessMessage(response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSavingPassword(false);
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
      <main className="min-h-screen bg-stone-50 p-6 text-zinc-700">
        Loading customer profile...
      </main>
    );
  }

  return (
    <main className="fh-page">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="fh-card p-7">
          <div className="mb-4">
            <BackButton />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
            Customer Account
          </p>
          <h1 className="mt-2 text-4xl font-black">
            Welcome, {profile?.name || user?.name}
          </h1>
          <p className="mt-3 text-zinc-700">
            Manage your profile and delivery addresses.
          </p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="fh-card flex gap-2 overflow-x-auto p-2 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible">
          {['overview', 'profile', 'addresses', 'security'].map((tab) => (
            <button
              className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize ${
                activeTab === tab
                  ? 'bg-[#FF4F2E] text-white'
                  : 'text-zinc-700 hover:bg-stone-50'
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-6">
        {error && (
          <p className="fh-alert-error">{error}</p>
        )}
        {successMessage && (
          <p className="fh-alert-success">
            {successMessage}
          </p>
        )}

        {activeTab === 'overview' && (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              {quickActions.map((action) => (
                <article
                  className="fh-card p-6"
                  key={action.to}
                >
                  <h2 className="text-xl font-bold">
                    {action.label}
                    {action.to === '/cart' && getCartCount() > 0
                      ? ` (${getCartCount()})`
                      : ''}
                  </h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-600">
                    {action.description}
                  </p>
                  <Link
                    className="fh-btn-primary mt-5"
                    to={action.to}
                  >
                    Open
                  </Link>
                </article>
              ))}
            </div>

            <button
              className="fh-card fh-card-hover w-full p-6 text-left"
              onClick={() => setActiveTab('addresses')}
              type="button"
            >
              <span className="text-xl font-bold">Saved Addresses</span>
              <span className="mt-2 block text-sm text-zinc-600">
                {addresses.length} saved delivery address
                {addresses.length === 1 ? '' : 'es'}
              </span>
            </button>
          </>
        )}

        {activeTab === 'profile' && (
          <form
            className="fh-card p-7"
            onSubmit={handleProfileSubmit}
          >
            <h2 className="text-2xl font-bold">Profile Information</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-medium text-zinc-700">Name</span>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-[#FF4F2E]"
                  name="name"
                  onChange={handleProfileChange}
                  required
                  value={profileForm.name}
                />
              </label>
              <label>
                <span className="text-sm font-medium text-zinc-700">Phone</span>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-[#FF4F2E]"
                  name="phone"
                  onChange={handleProfileChange}
                  value={profileForm.phone}
                />
              </label>
              <label className="md:col-span-2">
                <span className="text-sm font-medium text-zinc-700">
                  Avatar URL
                </span>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-[#FF4F2E]"
                  name="avatar"
                  onChange={handleProfileChange}
                  value={profileForm.avatar}
                />
              </label>
              <label>
                <span className="text-sm font-medium text-zinc-700">Email</span>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500"
                  readOnly
                  value={profile?.email || ''}
                />
              </label>
              <label>
                <span className="text-sm font-medium text-zinc-700">Role</span>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500"
                  readOnly
                  value={profile?.role || ''}
                />
              </label>
            </div>
            <button
              className="fh-btn-primary mt-6"
              disabled={isSavingProfile}
              type="submit"
            >
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <section className="fh-card p-7">
            <h2 className="text-2xl font-bold">Security</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Change the password used to sign in to your FoodHub account.
            </p>

            {profile?.authProvider === 'google' ? (
              <p className="mt-5 rounded-lg bg-stone-50 p-4 text-zinc-700">
                Password change is not available for Google sign-in accounts.
              </p>
            ) : (
              <form
                className="mt-6 max-w-xl space-y-4"
                onSubmit={handlePasswordSubmit}
              >
                {[
                  ['currentPassword', 'Current Password'],
                  ['newPassword', 'New Password'],
                  ['confirmPassword', 'Confirm New Password'],
                ].map(([name, label]) => (
                  <label className="block" key={name}>
                    <span className="text-sm font-medium text-zinc-700">
                      {label}
                    </span>
                    <input
                      autoComplete={
                        name === 'currentPassword'
                          ? 'current-password'
                          : 'new-password'
                      }
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-[#FF4F2E]"
                      minLength={name === 'currentPassword' ? undefined : 6}
                      name={name}
                      onChange={handlePasswordChange}
                      required
                      type="password"
                      value={passwordForm[name]}
                    />
                  </label>
                ))}

                <button
                  className="rounded-md bg-[#FF4F2E] px-5 py-2 font-semibold text-white hover:bg-[#E63E22] disabled:bg-stone-300"
                  disabled={isSavingPassword}
                  type="submit"
                >
                  {isSavingPassword ? 'Saving...' : 'Save Password'}
                </button>
              </form>
            )}
          </section>
        )}

        {activeTab === 'addresses' && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Saved Addresses</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Choose a default address for faster checkout.
                </p>
              </div>
              {!isAddingAddress && !editingAddress && (
                <button
                  className="fh-btn-primary"
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
              <p className="rounded-xl bg-white p-6 text-zinc-700 shadow-sm">
                No saved addresses yet.
              </p>
            )}

            {!isAddingAddress && !editingAddress && addresses.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((address) => (
                  <article
                    className="fh-card p-5"
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
                    <div className="mt-3 text-sm leading-6 text-zinc-700">
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
                        className="rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-[#FF4F2E] hover:bg-stone-50"
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
        </div>
        </div>
      </section>
    </main>
  );
}

export default CustomerAccountPage;
