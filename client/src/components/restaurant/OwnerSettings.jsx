import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { changeMyPassword } from "../../services/authService";
import { updateMyRestaurant } from "../../services/restaurantService";

const defaultOrderPreferences = {
  acceptsOnlineOrders: true,
  autoAcceptOrders: false,
  defaultPreparationTime: 30,
  minimumOrderAmount: 0,
  deliveryFee: 0,
};

const defaultRestaurantPreferences = {
  ownerPreferenceLanguage: "en",
  ownerTimeFormat: "24h",
};

function SectionCard({ children, description, title }) {
  return (
    <section className="fh-card p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black text-zinc-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-zinc-600">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({ children, label }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Toggle({ checked, disabled, label, name, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4">
      <span className="font-semibold text-zinc-800">{label}</span>
      <input
        checked={checked}
        className="h-5 w-5 accent-[#FF4F2E]"
        disabled={disabled}
        name={name}
        onChange={onChange}
        type="checkbox"
      />
    </label>
  );
}

function OwnerSettings({ onRestaurantUpdated, restaurant }) {
  const { updateAccount, user } = useAuth();
  const [accountForm, setAccountForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [orderPreferences, setOrderPreferences] = useState(
    defaultOrderPreferences,
  );
  const [restaurantPreferences, setRestaurantPreferences] = useState(
    defaultRestaurantPreferences,
  );
  const [pauseForm, setPauseForm] = useState({
    isTemporarilyPaused: false,
    temporaryPauseReason: "",
  });
  const [deactivationReason, setDeactivationReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");

  useEffect(() => {
    setAccountForm({
      name: user?.name || "",
      phone: user?.phone || "",
    });
  }, [user?.name, user?.phone]);

  useEffect(() => {
    if (!restaurant) {
      return;
    }

    setOrderPreferences({
      acceptsOnlineOrders: restaurant.acceptsOnlineOrders ?? true,
      autoAcceptOrders: restaurant.autoAcceptOrders ?? false,
      defaultPreparationTime: restaurant.defaultPreparationTime || 30,
      minimumOrderAmount: restaurant.minimumOrderAmount ?? 0,
      deliveryFee: restaurant.deliveryFee ?? 0,
    });
    setRestaurantPreferences({
      ownerPreferenceLanguage: restaurant.ownerPreferenceLanguage || "en",
      ownerTimeFormat: restaurant.ownerTimeFormat || "24h",
    });
    setPauseForm({
      isTemporarilyPaused: restaurant.isTemporarilyPaused ?? false,
      temporaryPauseReason: restaurant.temporaryPauseReason || "",
    });
  }, [restaurant]);

  const showSuccess = (nextMessage) => {
    setError("");
    setMessage(nextMessage);
  };

  const showError = (requestError) => {
    setMessage("");
    setError(requestError.message || "Something went wrong");
  };

  const saveRestaurantSettings = async (payload, successMessage, key) => {
    if (!restaurant) {
      setError(
        "Create a restaurant profile before changing restaurant settings.",
      );
      return;
    }

    try {
      setSavingKey(key);
      const response = await updateMyRestaurant(payload);
      onRestaurantUpdated(response.data.restaurant);
      showSuccess(successMessage);
    } catch (requestError) {
      showError(requestError);
    } finally {
      setSavingKey("");
    }
  };

  const handleAccountSubmit = async (event) => {
    event.preventDefault();

    if (!accountForm.name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setSavingKey("account");
      await updateAccount(accountForm);
      showSuccess("Account information updated successfully");
    } catch (requestError) {
      showError(requestError);
    } finally {
      setSavingKey("");
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setError("All password fields are required");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      setSavingKey("password");
      const response = await changeMyPassword(passwordForm);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showSuccess(response.message);
    } catch (requestError) {
      showError(requestError);
    } finally {
      setSavingKey("");
    }
  };

  const handleOrderPreferenceSubmit = (event) => {
    event.preventDefault();
    saveRestaurantSettings(
      {
        ...orderPreferences,
        defaultPreparationTime: Number(orderPreferences.defaultPreparationTime),
        deliveryFee: Number(orderPreferences.deliveryFee),
        minimumOrderAmount: Number(orderPreferences.minimumOrderAmount),
      },
      "Order preferences updated successfully",
      "orders",
    );
  };

  const handleRestaurantPreferenceSubmit = (event) => {
    event.preventDefault();
    saveRestaurantSettings(
      restaurantPreferences,
      "Restaurant preferences updated successfully",
      "preferences",
    );
  };

  const handlePauseSubmit = (event) => {
    event.preventDefault();
    saveRestaurantSettings(
      {
        ...pauseForm,
        temporaryPauseReason: pauseForm.isTemporarilyPaused
          ? pauseForm.temporaryPauseReason
          : "",
      },
      pauseForm.isTemporarilyPaused
        ? "Restaurant paused for online orders"
        : "Restaurant reopened for online orders",
      "pause",
    );
  };

  const handleDeactivationSubmit = (event) => {
    event.preventDefault();

    if (!deactivationReason.trim()) {
      setError("Please add a reason for deactivation request");
      return;
    }

    saveRestaurantSettings(
      {
        deactivationRequest: {
          reason: deactivationReason,
        },
      },
      "Deactivation request submitted",
      "deactivation",
    );
  };

  const isGoogleOnlyAccount = user?.authProvider === "google";
  const accountStatus = user?.isBlocked ? "Blocked" : "Active";
  const deactivationStatus = restaurant?.deactivationRequest?.status || "none";

  return (
    <div className="space-y-6">
      {(message || error) && (
        <p className={error ? "fh-alert-error" : "fh-alert-success"}>
          {error || message}
        </p>
      )}

      <SectionCard
        description="Keep the owner contact details tidy for operations and support."
        title="Account Information"
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleAccountSubmit}
        >
          <Field label="Name">
            <input
              className="fh-input"
              name="name"
              onChange={(event) =>
                setAccountForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              value={accountForm.name}
            />
          </Field>
          <Field label="Email">
            <input
              className="fh-input bg-stone-50 text-zinc-500"
              readOnly
              value={user?.email || ""}
            />
          </Field>
          <Field label="Phone">
            <input
              className="fh-input"
              name="phone"
              onChange={(event) =>
                setAccountForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              placeholder="Optional phone number"
              value={accountForm.phone}
            />
          </Field>
          <div className="flex items-end">
            <button
              className="fh-btn-primary w-full md:w-auto"
              disabled={savingKey === "account"}
              type="submit"
            >
              {savingKey === "account" ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        description="Change the password for this local FoodHub owner account."
        title="Security"
      >
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-zinc-700">
            Account status
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              user?.isBlocked
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-700"
            }`}
          >
            {accountStatus}
          </span>
        </div>

        {isGoogleOnlyAccount ? (
          <p className="rounded-2xl bg-stone-50 p-4 text-sm font-medium text-zinc-700">
            Password change is not available for Google sign-in accounts.
          </p>
        ) : (
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={handlePasswordSubmit}
          >
            <Field label="Current Password">
              <input
                className="fh-input"
                name="currentPassword"
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
                type="password"
                value={passwordForm.currentPassword}
              />
            </Field>
            <Field label="New Password">
              <input
                className="fh-input"
                name="newPassword"
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
                type="password"
                value={passwordForm.newPassword}
              />
            </Field>
            <Field label="Confirm New Password">
              <input
                className="fh-input"
                name="confirmPassword"
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                type="password"
                value={passwordForm.confirmPassword}
              />
            </Field>
            <button
              className="fh-btn-primary md:col-span-3 md:w-fit"
              disabled={savingKey === "password"}
              type="submit"
            >
              {savingKey === "password" ? "Saving..." : "Save"}
            </button>
          </form>
        )}
      </SectionCard>

      <SectionCard
        description="Control how customers can place orders with your restaurant."
        title="Order Preferences"
      >
        {!restaurant && (
          <p className="mb-4 rounded-2xl bg-stone-50 p-4 text-sm font-medium text-zinc-700">
            Create a restaurant profile before changing order preferences.
          </p>
        )}
        <form className="space-y-4" onSubmit={handleOrderPreferenceSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Toggle
              checked={orderPreferences.acceptsOnlineOrders}
              disabled={!restaurant}
              label="Accept online orders"
              name="acceptsOnlineOrders"
              onChange={(event) =>
                setOrderPreferences((current) => ({
                  ...current,
                  acceptsOnlineOrders: event.target.checked,
                }))
              }
            />
            <Toggle
              checked={orderPreferences.autoAcceptOrders}
              disabled={!restaurant}
              label="Auto-accept orders"
              name="autoAcceptOrders"
              onChange={(event) =>
                setOrderPreferences((current) => ({
                  ...current,
                  autoAcceptOrders: event.target.checked,
                }))
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Default preparation time">
              <select
                className="fh-input"
                disabled={!restaurant}
                onChange={(event) =>
                  setOrderPreferences((current) => ({
                    ...current,
                    defaultPreparationTime: event.target.value,
                  }))
                }
                value={orderPreferences.defaultPreparationTime}
              >
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
              </select>
            </Field>
            <Field label="Minimum order amount">
              <input
                className="fh-input"
                disabled={!restaurant}
                min="0"
                onChange={(event) =>
                  setOrderPreferences((current) => ({
                    ...current,
                    minimumOrderAmount: event.target.value,
                  }))
                }
                step="0.01"
                type="number"
                value={orderPreferences.minimumOrderAmount}
              />
            </Field>
            <Field label="Delivery fee">
              <input
                className="fh-input"
                disabled={!restaurant}
                min="0"
                onChange={(event) =>
                  setOrderPreferences((current) => ({
                    ...current,
                    deliveryFee: event.target.value,
                  }))
                }
                step="0.01"
                type="number"
                value={orderPreferences.deliveryFee}
              />
            </Field>
          </div>
          <button
            className="fh-btn-primary"
            disabled={!restaurant || savingKey === "orders"}
            type="submit"
          >
            {savingKey === "orders" ? "Saving..." : "Save"}
          </button>
        </form>
      </SectionCard>

      <SectionCard
        description="Display preferences for the owner dashboard."
        title="Restaurant Preferences"
      >
        <form
          className="grid gap-4 md:grid-cols-3"
          onSubmit={handleRestaurantPreferenceSubmit}
        >
          <Field label="Currency">
            <input
              className="fh-input bg-stone-50 text-zinc-500"
              readOnly
              value="EUR"
            />
          </Field>
          <Field label="Language">
            <select
              className="fh-input"
              disabled={!restaurant}
              onChange={(event) =>
                setRestaurantPreferences((current) => ({
                  ...current,
                  ownerPreferenceLanguage: event.target.value,
                }))
              }
              value={restaurantPreferences.ownerPreferenceLanguage}
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </Field>
          <Field label="Time format">
            <select
              className="fh-input"
              disabled={!restaurant}
              onChange={(event) =>
                setRestaurantPreferences((current) => ({
                  ...current,
                  ownerTimeFormat: event.target.value,
                }))
              }
              value={restaurantPreferences.ownerTimeFormat}
            >
              <option value="24h">24-hour</option>
              <option value="12h">12-hour</option>
            </select>
          </Field>
          <button
            className="fh-btn-primary md:col-span-3 md:w-fit"
            disabled={!restaurant || savingKey === "preferences"}
            type="submit"
          >
            {savingKey === "preferences" ? "Saving..." : "Save"}
          </button>
        </form>
      </SectionCard>

      <SectionCard
        description="Pause online ordering temporarily or request account deactivation."
        title="Restaurant Control"
      >
        <form className="space-y-4" onSubmit={handlePauseSubmit}>
          <Toggle
            checked={pauseForm.isTemporarilyPaused}
            disabled={!restaurant}
            label="Temporarily pause restaurant orders"
            name="isTemporarilyPaused"
            onChange={(event) =>
              setPauseForm((current) => ({
                ...current,
                isTemporarilyPaused: event.target.checked,
              }))
            }
          />
          <Field label="Pause reason">
            <textarea
              className="fh-input min-h-24"
              disabled={!restaurant}
              onChange={(event) =>
                setPauseForm((current) => ({
                  ...current,
                  temporaryPauseReason: event.target.value,
                }))
              }
              placeholder="Example: Closed for private event"
              value={pauseForm.temporaryPauseReason}
            />
          </Field>
          <button
            className="fh-btn-primary"
            disabled={!restaurant || savingKey === "pause"}
            type="submit"
          >
            {savingKey === "pause" ? "Saving..." : "Save"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/60 p-5">
          <h3 className="font-black text-red-700">Danger Zone</h3>
          <p className="mt-2 text-sm text-red-700">
            Permanent deletion is disabled for the MVP. You can request
            deactivation, and an admin can review it later.
          </p>
          <p className="mt-3 text-sm font-semibold text-red-700">
            Current request status: {deactivationStatus}
          </p>
          <form className="mt-4 space-y-3" onSubmit={handleDeactivationSubmit}>
            <textarea
              className="fh-input min-h-24"
              disabled={!restaurant}
              onChange={(event) => setDeactivationReason(event.target.value)}
              placeholder="Reason for deactivation request"
              value={deactivationReason}
            />
            <button
              className="rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!restaurant || savingKey === "deactivation"}
              type="submit"
            >
              {savingKey === "deactivation"
                ? "Submitting..."
                : "Request Deactivation"}
            </button>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}

export default OwnerSettings;
