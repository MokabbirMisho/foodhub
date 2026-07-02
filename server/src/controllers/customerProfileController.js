import User from '../models/User.js';

const customerProfileFields =
  'name email phone avatar role authProvider isBlocked addresses createdAt updatedAt';

const sendErrorResponse = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};

const handleProfileError = (res, error) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(', ');
    return sendErrorResponse(res, 400, message);
  }

  return sendErrorResponse(res, 500, 'Server error');
};

const getCustomer = (userId) => {
  return User.findOne({ _id: userId, role: 'customer' }).select(
    customerProfileFields,
  );
};

const getSortedAddresses = (user) => {
  return user.addresses
    .map((address) => address.toObject())
    .sort((first, second) => Number(second.isDefault) - Number(first.isDefault));
};

const hasValidLocation = (location) => {
  return (
    typeof location?.lat === 'number' &&
    Number.isFinite(location.lat) &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    typeof location?.lng === 'number' &&
    Number.isFinite(location.lng) &&
    location.lng >= -180 &&
    location.lng <= 180
  );
};

const buildAddressData = (body, user, existingAddress = {}) => {
  const addressData = {};
  const allowedFields = [
    'label',
    'fullName',
    'phone',
    'street',
    'city',
    'postalCode',
    'country',
    'isDefault',
  ];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      addressData[field] = body[field];
    }
  });

  if (!existingAddress._id) {
    addressData.fullName = body.fullName || user.name;
    addressData.phone = body.phone || user.phone;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'location')) {
    addressData.location = body.location;
  }

  return addressData;
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await getCustomer(req.user._id);

    res.json({
      success: true,
      message: 'Profile fetched successfully',
      data: { user },
    });
  } catch (error) {
    handleProfileError(res, error);
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const updates = {};

    ['name', 'phone', 'avatar'].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, role: 'customer' },
      updates,
      { new: true, runValidators: true },
    ).select(customerProfileFields);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    handleProfileError(res, error);
  }
};

export const getMyAddresses = async (req, res) => {
  try {
    const user = await getCustomer(req.user._id);

    res.json({
      success: true,
      message: 'Addresses fetched successfully',
      data: { addresses: getSortedAddresses(user) },
    });
  } catch (error) {
    handleProfileError(res, error);
  }
};

export const addMyAddress = async (req, res) => {
  try {
    const user = await getCustomer(req.user._id);
    const { city, location, postalCode, street } = req.body;

    if (!street?.trim() || !city?.trim() || !postalCode?.trim()) {
      return sendErrorResponse(
        res,
        400,
        'Street, city, and postal code are required',
      );
    }

    if (location && !hasValidLocation(location)) {
      return sendErrorResponse(res, 400, 'Address location is invalid');
    }

    const shouldBeDefault = req.body.isDefault === true || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    user.addresses.push({
      ...buildAddressData(req.body, user),
      isDefault: shouldBeDefault,
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { addresses: getSortedAddresses(user) },
    });
  } catch (error) {
    handleProfileError(res, error);
  }
};

export const updateMyAddress = async (req, res) => {
  try {
    const user = await getCustomer(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return sendErrorResponse(res, 404, 'Address not found');
    }

    if (req.body.location && !hasValidLocation(req.body.location)) {
      return sendErrorResponse(res, 400, 'Address location is invalid');
    }

    if (req.body.isDefault === true) {
      user.addresses.forEach((item) => {
        item.isDefault = false;
      });
    }

    address.set(buildAddressData(req.body, user, address));
    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: { addresses: getSortedAddresses(user) },
    });
  } catch (error) {
    handleProfileError(res, error);
  }
};

export const deleteMyAddress = async (req, res) => {
  try {
    const user = await getCustomer(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return sendErrorResponse(res, 404, 'Address not found');
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: { addresses: getSortedAddresses(user) },
    });
  } catch (error) {
    handleProfileError(res, error);
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const user = await getCustomer(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return sendErrorResponse(res, 404, 'Address not found');
    }

    user.addresses.forEach((item) => {
      item.isDefault = String(item._id) === String(address._id);
    });
    await user.save();

    res.json({
      success: true,
      message: 'Default address updated successfully',
      data: { addresses: getSortedAddresses(user) },
    });
  } catch (error) {
    handleProfileError(res, error);
  }
};
