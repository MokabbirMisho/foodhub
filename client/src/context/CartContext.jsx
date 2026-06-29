import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CART_STORAGE_KEY = 'foodhub_cart';

const getStoredCart = () => {
  const storedCart = localStorage.getItem(CART_STORAGE_KEY);

  if (!storedCart) {
    return {
      cartItems: [],
      restaurant: null,
    };
  }

  try {
    return JSON.parse(storedCart);
  } catch (error) {
    localStorage.removeItem(CART_STORAGE_KEY);
    return {
      cartItems: [],
      restaurant: null,
    };
  }
};

const getEffectivePrice = (item) => {
  if (item.discountPrice !== null && item.discountPrice !== undefined) {
    return Number(item.discountPrice);
  }

  return Number(item.price || 0);
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const storedCart = getStoredCart();
  const [cartItems, setCartItems] = useState(storedCart.cartItems);
  const [restaurant, setRestaurant] = useState(storedCart.restaurant);

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        cartItems,
        restaurant,
      }),
    );
  }, [cartItems, restaurant]);

  const addToCart = (foodItem, restaurantInfo) => {
    if (foodItem.isAvailable === false) {
      return {
        success: false,
        message: 'This item is currently unavailable.',
      };
    }

    if (
      restaurant &&
      restaurantInfo?._id &&
      String(restaurant._id) !== String(restaurantInfo._id)
    ) {
      return {
        success: false,
        message: 'Your cart has items from another restaurant. Please clear your cart first.',
      };
    }

    setRestaurant(restaurantInfo);
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item._id === foodItem._id);

      if (existingItem) {
        return currentItems.map((item) =>
          item._id === foodItem._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          _id: foodItem._id,
          name: foodItem.name,
          price: foodItem.price,
          discountPrice: foodItem.discountPrice,
          image: foodItem.image,
          category: foodItem.category,
          quantity: 1,
        },
      ];
    });

    return {
      success: true,
      message: 'Item added to cart',
    };
  };

  const removeFromCart = (foodItemId) => {
    setCartItems((currentItems) => {
      const nextItems = currentItems.filter((item) => item._id !== foodItemId);

      if (nextItems.length === 0) {
        setRestaurant(null);
      }

      return nextItems;
    });
  };

  const increaseQuantity = (foodItemId) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item._id === foodItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  };

  const decreaseQuantity = (foodItemId) => {
    setCartItems((currentItems) => {
      const nextItems = currentItems
        .map((item) =>
          item._id === foodItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0);

      if (nextItems.length === 0) {
        setRestaurant(null);
      }

      return nextItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurant(null);
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + getEffectivePrice(item) * item.quantity;
    }, 0);
  };

  const getDeliveryFee = () => {
    if (!restaurant) {
      return 0;
    }

    return Number(restaurant.deliveryFee || 0);
  };

  const getTotal = () => getSubtotal() + getDeliveryFee();

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = useMemo(
    () => ({
      cartItems,
      restaurant,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      getSubtotal,
      getDeliveryFee,
      getTotal,
      getCartCount,
    }),
    [cartItems, restaurant],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside a CartProvider');
  }

  return context;
};

