const dayNames = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const defaultHours = {
  monday: { isClosed: false, open: '10:00', close: '22:00' },
  tuesday: { isClosed: false, open: '10:00', close: '22:00' },
  wednesday: { isClosed: false, open: '10:00', close: '22:00' },
  thursday: { isClosed: false, open: '10:00', close: '22:00' },
  friday: { isClosed: false, open: '10:00', close: '23:00' },
  saturday: { isClosed: false, open: '11:00', close: '23:00' },
  sunday: { isClosed: false, open: '11:00', close: '22:00' },
};

const getGermanDateParts = () => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );

  return {
    day: parts.weekday.toLowerCase(),
    time: `${parts.hour}:${parts.minute}`,
  };
};

const normalizeDayHours = (day, value) => {
  if (value && typeof value === 'object') {
    return {
      isClosed: Boolean(value.isClosed),
      open: value.open || defaultHours[day].open,
      close: value.close || defaultHours[day].close,
    };
  }

  // Keep older restaurant records with "10:00 - 22:00" values readable.
  if (typeof value === 'string') {
    const [open, close] = value.split(/\s*-\s*/);
    if (open && close) {
      return { isClosed: false, open, close };
    }
  }

  return defaultHours[day];
};

export const getRestaurantAvailability = (restaurant) => {
  const { day, time } = getGermanDateParts();
  const todayHours = {
    day,
    ...normalizeDayHours(day, restaurant?.openingHours?.[day]),
  };

  if (!restaurant?.isApproved || !restaurant?.isActive) {
    return {
      isAvailableNow: false,
      reason: 'Restaurant is not available',
      todayHours,
    };
  }

  if (restaurant.acceptsOnlineOrders === false) {
    return {
      isAvailableNow: false,
      reason: 'This restaurant is not accepting online orders right now.',
      todayHours,
    };
  }

  if (restaurant.isTemporarilyPaused) {
    return {
      isAvailableNow: false,
      reason:
        restaurant.temporaryPauseReason ||
        'This restaurant is not accepting online orders right now.',
      todayHours,
    };
  }

  if (restaurant.isTemporarilyClosed || restaurant.isOpen === false) {
    return {
      isAvailableNow: false,
      reason:
        restaurant.temporaryClosedReason || 'Restaurant is temporarily closed',
      todayHours,
    };
  }

  if (todayHours.isClosed) {
    return {
      isAvailableNow: false,
      reason: 'Restaurant is closed today',
      todayHours,
    };
  }

  if (time < todayHours.open) {
    return {
      isAvailableNow: false,
      reason: `Opens at ${todayHours.open}`,
      todayHours,
    };
  }

  if (time >= todayHours.close) {
    return {
      isAvailableNow: false,
      reason: 'Closed for today',
      todayHours,
    };
  }

  return {
    isAvailableNow: true,
    reason: 'Open now',
    todayHours,
  };
};

export const restaurantScheduleDays = dayNames;
