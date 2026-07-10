import { useEffect, useState } from 'react';
import { updateMyRestaurantAvailability } from '../../services/restaurantService';

const days = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const defaults = {
  monday: { isClosed: false, open: '10:00', close: '22:00' },
  tuesday: { isClosed: false, open: '10:00', close: '22:00' },
  wednesday: { isClosed: false, open: '10:00', close: '22:00' },
  thursday: { isClosed: false, open: '10:00', close: '22:00' },
  friday: { isClosed: false, open: '10:00', close: '23:00' },
  saturday: { isClosed: false, open: '11:00', close: '23:00' },
  sunday: { isClosed: false, open: '11:00', close: '22:00' },
};

const normalizeSchedule = (openingHours = {}) =>
  Object.fromEntries(
    days.map((day) => {
      const value = openingHours[day];

      if (value && typeof value === 'object') {
        return [day, { ...defaults[day], ...value }];
      }

      if (typeof value === 'string') {
        const [open, close] = value.split(/\s*-\s*/);
        if (open && close) {
          return [day, { isClosed: false, open, close }];
        }
      }

      return [day, defaults[day]];
    }),
  );

function RestaurantAvailabilityForm({ onUpdated, restaurant }) {
  const [openingHours, setOpeningHours] = useState(() =>
    normalizeSchedule(restaurant.openingHours),
  );
  const [isTemporarilyClosed, setIsTemporarilyClosed] = useState(
    restaurant.isTemporarilyClosed || false,
  );
  const [temporaryClosedReason, setTemporaryClosedReason] = useState(
    restaurant.temporaryClosedReason || '',
  );
  const [availabilityNote, setAvailabilityNote] = useState(
    restaurant.availabilityNote || '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setOpeningHours(normalizeSchedule(restaurant.openingHours));
    setIsTemporarilyClosed(restaurant.isTemporarilyClosed || false);
    setTemporaryClosedReason(restaurant.temporaryClosedReason || '');
    setAvailabilityNote(restaurant.availabilityNote || '');
  }, [restaurant]);

  const updateDay = (day, field, value) => {
    setOpeningHours((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value,
      },
    }));
  };

  const saveAvailability = async (payload, message) => {
    try {
      setError('');
      setSuccess('');
      setIsSaving(true);
      const response = await updateMyRestaurantAvailability(payload);
      onUpdated(response.data.restaurant);
      setSuccess(message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemporaryStatusSubmit = (event) => {
    event.preventDefault();
    saveAvailability(
      {
        isTemporarilyClosed,
        temporaryClosedReason,
        availabilityNote,
      },
      'Temporary availability updated successfully',
    );
  };

  const handleScheduleSubmit = (event) => {
    event.preventDefault();
    saveAvailability(
      { openingHours, availabilityNote },
      'Opening hours updated successfully',
    );
  };

  const availability = restaurant.availability;
  const todayHours = availability?.todayHours;

  return (
    <div className="space-y-6">
      <section className="fh-card p-6">
        <p className="fh-eyebrow">Current availability</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              availability?.isAvailableNow
                ? 'bg-green-100 text-green-800'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {availability?.isAvailableNow ? 'Open now' : 'Closed'}
          </span>
          <span className="text-sm text-zinc-700">
            {availability?.reason || 'Availability has not been calculated yet'}
          </span>
        </div>
        {todayHours && (
          <p className="mt-3 text-sm capitalize text-zinc-600">
            {todayHours.day}:{' '}
            {todayHours.isClosed
              ? 'Closed'
              : `${todayHours.open} - ${todayHours.close}`}
          </p>
        )}
      </section>

      {(error || success) && (
        <p className={error ? 'fh-alert-error' : 'fh-alert-success'}>
          {error || success}
        </p>
      )}

      <form className="fh-card space-y-4 p-6" onSubmit={handleTemporaryStatusSubmit}>
        <div>
          <h2 className="text-xl font-bold">Temporary closure</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Pause ordering immediately for maintenance, holidays, or kitchen
            closures.
          </p>
        </div>
        <label className="flex items-center gap-3">
          <input
            checked={isTemporarilyClosed}
            className="h-5 w-5 accent-[#FF4F2E]"
            onChange={(event) => setIsTemporarilyClosed(event.target.checked)}
            type="checkbox"
          />
          <span className="font-medium">Temporarily closed</span>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Reason</span>
          <input
            className="fh-input mt-1"
            onChange={(event) => setTemporaryClosedReason(event.target.value)}
            placeholder="Closed for maintenance"
            value={temporaryClosedReason}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Customer availability note
          </span>
          <input
            className="fh-input mt-1"
            onChange={(event) => setAvailabilityNote(event.target.value)}
            placeholder="Optional note"
            value={availabilityNote}
          />
        </label>
        <button className="fh-btn-primary" disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : 'Save temporary status'}
        </button>
      </form>

      <form className="fh-card p-6" onSubmit={handleScheduleSubmit}>
        <div>
          <h2 className="text-xl font-bold">Weekly opening hours</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Ordering is available only inside these hours.
          </p>
        </div>
        <div className="mt-5 space-y-3">
          {days.map((day) => {
            const schedule = openingHours[day];

            return (
              <div
                className="grid gap-3 rounded-lg border border-stone-200 p-4 sm:grid-cols-[140px_1fr_1fr] sm:items-end"
                key={day}
              >
                <label className="flex items-center gap-2 capitalize sm:self-center">
                  <input
                    checked={schedule.isClosed}
                    className="accent-[#FF4F2E]"
                    onChange={(event) =>
                      updateDay(day, 'isClosed', event.target.checked)
                    }
                    type="checkbox"
                  />
                  {day} closed
                </label>
                <label>
                  <span className="text-xs font-semibold text-zinc-600">Open</span>
                  <input
                    className="fh-input mt-1"
                    disabled={schedule.isClosed}
                    onChange={(event) => updateDay(day, 'open', event.target.value)}
                    type="time"
                    value={schedule.open}
                  />
                </label>
                <label>
                  <span className="text-xs font-semibold text-zinc-600">Close</span>
                  <input
                    className="fh-input mt-1"
                    disabled={schedule.isClosed}
                    onChange={(event) => updateDay(day, 'close', event.target.value)}
                    type="time"
                    value={schedule.close}
                  />
                </label>
              </div>
            );
          })}
        </div>
        <button className="fh-btn-primary mt-5" disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : 'Save opening hours'}
        </button>
      </form>
    </div>
  );
}

export default RestaurantAvailabilityForm;
