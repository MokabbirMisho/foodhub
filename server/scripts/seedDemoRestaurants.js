import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../src/models/User.js";
import Restaurant from "../src/models/Restaurant.js";
import FoodItem from "../src/models/FoodItem.js";

dotenv.config();

const demoPassword = "Owner123";

const demoImage = (text) =>
  `https://placehold.co/900x600/FFF3E0/F97316?text=${encodeURIComponent(text)}`;

const ownerUsers = [
  {
    name: "Pizza Roma Owner",
    email: "owner.pizza@example.com",
    password: demoPassword,
    role: "restaurant_owner",
    phone: "+49 231 2001001",
    authProvider: "local",
    isBlocked: false,
  },
  {
    name: "Burger House Owner",
    email: "owner.burger@example.com",
    password: demoPassword,
    role: "restaurant_owner",
    phone: "+49 231 2001002",
    authProvider: "local",
    isBlocked: false,
  },
  {
    name: "Bengal Biryani Owner",
    email: "owner.bengal@example.com",
    password: demoPassword,
    role: "restaurant_owner",
    phone: "+49 231 2001003",
    authProvider: "local",
    isBlocked: false,
  },
  {
    name: "Sushi Zen Owner",
    email: "owner.sushi@example.com",
    password: demoPassword,
    role: "restaurant_owner",
    phone: "+49 231 2001004",
    authProvider: "local",
    isBlocked: false,
  },
  {
    name: "Vegan Garden Owner",
    email: "owner.vegan@example.com",
    password: demoPassword,
    role: "restaurant_owner",
    phone: "+49 231 2001005",
    authProvider: "local",
    isBlocked: false,
  },
];

const defaultOpeningHours = {
  monday: { isClosed: false, open: "10:00", close: "22:00" },
  tuesday: { isClosed: false, open: "10:00", close: "22:00" },
  wednesday: { isClosed: false, open: "10:00", close: "22:00" },
  thursday: { isClosed: false, open: "10:00", close: "22:00" },
  friday: { isClosed: false, open: "10:00", close: "23:00" },
  saturday: { isClosed: false, open: "11:00", close: "23:00" },
  sunday: { isClosed: false, open: "11:00", close: "22:00" },
};

const restaurantTemplates = [
  {
    ownerEmail: "owner.pizza@example.com",
    name: "Pizza Roma",
    description:
      "Authentic Italian pizza and pasta made with fresh ingredients and classic recipes.",
    phone: "+49 231 1001001",
    email: "pizzaroma@example.com",
    address: "Westenhellweg 45, 44137 Dortmund",
    city: "Dortmund",
    cuisineTypes: ["Italian", "Pizza", "Pasta"],
    logo: "https://res.cloudinary.com/db3rovvex/image/upload/v1783277592/dan-crile-YeuTh1rBYLA-unsplash_mapymn.jpg",
    coverImage:
      "https://res.cloudinary.com/db3rovvex/image/upload/v1783277592/dan-crile-YeuTh1rBYLA-unsplash_mapymn.jpg",
    ratingAverage: 4.6,
    ratingCount: 128,
    minimumOrderAmount: 12,
    deliveryFee: 1.99,
    estimatedDeliveryTime: 30,
    foods: [
      {
        name: "Margherita Pizza",
        description: "Classic pizza with tomato sauce, mozzarella, and basil.",
        price: 8.99,
        category: "Pizza",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346272/phillip-goldsberry-PKfz98depf0-unsplash_wfkkdd.jpg",
        isVegetarian: true,
        preparationTime: 15,
        tags: ["pizza", "italian", "vegetarian"],
      },
      {
        name: "Pepperoni Pizza",
        description: "Spicy pepperoni, mozzarella, and tomato sauce.",
        price: 10.99,
        category: "Pizza",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346265/cesar-cabrera-MCfD3z8B8II-unsplash_xrzwwg.jpg",
        isVegetarian: false,
        preparationTime: 18,
        tags: ["pizza", "pepperoni", "italian"],
      },
      {
        name: "Creamy Chicken Pasta",
        description: "Pasta with grilled chicken and creamy Alfredo sauce.",
        price: 11.49,
        category: "Pasta",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346263/kimia-kazemi-971_E-LvZuc-unsplash_t79ddi.jpg",
        isVegetarian: false,
        preparationTime: 20,
        tags: ["pasta", "chicken", "italian"],
      },
      {
        name: "Tiramisu",
        description: "Classic Italian coffee-flavored dessert.",
        price: 4.99,
        category: "Dessert",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346269/laura-peruchi-_SrCiKojoyM-unsplash_szvk1y.jpg",
        isVegetarian: true,
        preparationTime: 5,
        tags: ["dessert", "italian", "sweet"],
      },
    ],
  },
  {
    ownerEmail: "owner.burger@example.com",
    name: "Burger House",
    description:
      "Juicy burgers, crispy fries, and classic fast-food favorites.",
    phone: "+49 231 1001002",
    email: "burgerhouse@example.com",
    address: "Kampstraße 22, 44137 Dortmund",
    city: "Dortmund",
    cuisineTypes: ["Burger", "Fast Food", "American"],
    logo: "https://res.cloudinary.com/db3rovvex/image/upload/v1783279113/amirali-mirhashemian-jh5XyK4Rr3Y-unsplash_msbkhp.jpg",
    coverImage:
      "https://res.cloudinary.com/db3rovvex/image/upload/v1783279113/amirali-mirhashemian-jh5XyK4Rr3Y-unsplash_msbkhp.jpg",
    ratingAverage: 4.4,
    ratingCount: 96,
    minimumOrderAmount: 10,
    deliveryFee: 2.49,
    estimatedDeliveryTime: 25,
    foods: [
      {
        name: "Classic Beef Burger",
        description:
          "Beef patty with cheese, lettuce, tomato, onion, and house sauce.",
        price: 9.49,
        category: "Burger",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346269/amirali-mirhashemian-sc5sTPMrVfk-unsplash_osfujj.jpg",
        isVegetarian: false,
        preparationTime: 15,
        tags: ["burger", "beef", "fast food"],
      },
      {
        name: "Crispy Chicken Burger",
        description: "Crispy chicken fillet with lettuce and spicy mayo.",
        price: 8.99,
        category: "Burger",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346262/david-foodphototasty-VFVnZfogE7s-unsplash_spfa2c.jpg",
        isVegetarian: false,
        preparationTime: 15,
        tags: ["burger", "chicken", "crispy"],
      },
      {
        name: "Loaded Cheese Fries",
        description: "Fries topped with melted cheese and special sauce.",
        price: 5.99,
        category: "Sides",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346268/nahima-aparicio-PrOraTAsGsY-unsplash_ihpgdz.jpg",
        isVegetarian: true,
        preparationTime: 10,
        tags: ["fries", "cheese", "sides"],
      },
      {
        name: "Chocolate Milkshake",
        description: "Creamy chocolate milkshake.",
        price: 4.49,
        category: "Drinks",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346271/siddharth-salve-8wESIey6sYQ-unsplash_kc81wn.jpg",
        isVegetarian: true,
        preparationTime: 5,
        tags: ["drink", "milkshake", "chocolate"],
      },
    ],
  },
  {
    ownerEmail: "owner.bengal@example.com",
    name: "Bengal Biryani",
    description:
      "Traditional Bangladeshi and Indian dishes with rich spices and halal ingredients.",
    phone: "+49 231 1001003",
    email: "bengalbiryani@example.com",
    address: "Münsterstraße 78, 44145 Dortmund",
    city: "Dortmund",
    cuisineTypes: ["Bangladeshi", "Indian", "Halal", "Biryani"],
    logo: "https://res.cloudinary.com/db3rovvex/image/upload/v1783279125/anil-sharma-seJrQGuPJKw-unsplash_u9zzme.jpg",
    coverImage:
      "https://res.cloudinary.com/db3rovvex/image/upload/v1783279125/anil-sharma-seJrQGuPJKw-unsplash_u9zzme.jpg",
    ratingAverage: 4.8,
    ratingCount: 154,
    minimumOrderAmount: 15,
    deliveryFee: 2.99,
    estimatedDeliveryTime: 40,
    foods: [
      {
        name: "Chicken Biryani",
        description:
          "Aromatic basmati rice cooked with chicken, spices, and herbs.",
        price: 12.99,
        category: "Biryani",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346266/mario-raj-ysmeQt1dzcw-unsplash_qe39gc.jpg",
        isVegetarian: false,
        preparationTime: 25,
        tags: ["biryani", "chicken", "halal", "bangladeshi"],
      },
      {
        name: "Beef Tehari",
        description: "Traditional beef rice dish with Bangladeshi spices.",
        price: 13.49,
        category: "Rice",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346259/collab-media-zmm--Wl0mrU-unsplash_oms6fb.jpg",
        isVegetarian: false,
        preparationTime: 25,
        tags: ["rice", "beef", "tehari", "halal"],
      },
      {
        name: "Butter Chicken",
        description: "Creamy tomato-based chicken curry served with rice.",
        price: 11.99,
        category: "Curry",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346270/rimsha-noor-tsQhEvzU6MQ-unsplash_irdrfg.jpg",
        isVegetarian: false,
        preparationTime: 22,
        tags: ["curry", "chicken", "indian", "halal"],
      },
      {
        name: "Mango Lassi",
        description: "Sweet mango yogurt drink.",
        price: 3.99,
        category: "Drinks",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346266/circle-digital-marketing-agency-8I2cgBzen8M-unsplash_qpm41c.jpg",
        isVegetarian: true,
        preparationTime: 5,
        tags: ["drink", "mango", "lassi"],
      },
    ],
  },
  {
    ownerEmail: "owner.sushi@example.com",
    name: "Sushi Zen",
    description:
      "Fresh sushi rolls, rice bowls, and Japanese-style healthy meals.",
    phone: "+49 231 1001004",
    email: "sushizen@example.com",
    address: "Kaiserstraße 12, 44135 Dortmund",
    city: "Dortmund",
    cuisineTypes: ["Japanese", "Sushi", "Asian"],
    logo: "https://res.cloudinary.com/db3rovvex/image/upload/v1783279141/mahmoud-fawzy-CIlzXVlYQJQ-unsplash_zz21ht.jpg",
    coverImage:
      "https://res.cloudinary.com/db3rovvex/image/upload/v1783279141/mahmoud-fawzy-CIlzXVlYQJQ-unsplash_zz21ht.jpg",
    ratingAverage: 4.5,
    ratingCount: 87,
    minimumOrderAmount: 18,
    deliveryFee: 3.49,
    estimatedDeliveryTime: 45,
    foods: [
      {
        name: "Salmon Maki",
        description: "Fresh salmon wrapped with sushi rice and seaweed.",
        price: 6.99,
        category: "Sushi",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346261/fer-almaraz-_vj4j6udETo-unsplash_dwh7bk.jpg",
        isVegetarian: false,
        preparationTime: 15,
        tags: ["sushi", "salmon", "japanese"],
      },
      {
        name: "Chicken Teriyaki Bowl",
        description:
          "Grilled chicken with teriyaki sauce, rice, and vegetables.",
        price: 10.99,
        category: "Rice Bowl",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346272/xavier-chng-hEeA50ZHo4o-unsplash_dldemq.jpg",
        isVegetarian: false,
        preparationTime: 20,
        tags: ["teriyaki", "chicken", "rice", "japanese"],
      },
      {
        name: "California Roll",
        description: "Sushi roll with crab, avocado, cucumber, and sesame.",
        price: 8.49,
        category: "Sushi",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346271/to-uyen-1HAQ4vKDDAo-unsplash_oezfio.jpg",
        isVegetarian: false,
        preparationTime: 15,
        tags: ["sushi", "roll", "asian"],
      },
      {
        name: "Miso Soup",
        description: "Traditional Japanese soup with tofu and seaweed.",
        price: 3.49,
        category: "Soup",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346263/green-and-great-6Ia1PRfvciQ-unsplash_qgxupw.jpg",
        isVegetarian: true,
        preparationTime: 8,
        tags: ["soup", "miso", "japanese"],
      },
    ],
  },
  {
    ownerEmail: "owner.vegan@example.com",
    name: "Vegan Garden",
    description:
      "Fresh plant-based meals, salads, bowls, smoothies, and healthy snacks.",
    phone: "+49 231 1001005",
    email: "vegangarden@example.com",
    address: "Rheinische Straße 55, 44137 Dortmund",
    city: "Dortmund",
    cuisineTypes: ["Vegan", "Healthy", "Salad", "Vegetarian"],
    logo: "https://res.cloudinary.com/db3rovvex/image/upload/v1783279136/david-foodphototasty-zhkhwGrqilw-unsplash_wlsnov.jpg",
    coverImage:
      "https://res.cloudinary.com/db3rovvex/image/upload/v1783279136/david-foodphototasty-zhkhwGrqilw-unsplash_wlsnov.jpg",
    ratingAverage: 4.7,
    ratingCount: 112,
    minimumOrderAmount: 11,
    deliveryFee: 1.49,
    estimatedDeliveryTime: 30,
    foods: [
      {
        name: "Vegan Buddha Bowl",
        description:
          "Quinoa, chickpeas, avocado, vegetables, and tahini dressing.",
        price: 10.49,
        category: "Bowl",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783279136/david-foodphototasty-zhkhwGrqilw-unsplash_wlsnov.jpg",
        isVegetarian: true,
        preparationTime: 15,
        tags: ["vegan", "healthy", "bowl"],
      },
      {
        name: "Falafel Wrap",
        description: "Crispy falafel with salad and vegan garlic sauce.",
        price: 7.99,
        category: "Wrap",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346271/to-uyen-1HAQ4vKDDAo-unsplash_oezfio.jpg",
        isVegetarian: true,
        preparationTime: 12,
        tags: ["vegan", "wrap", "falafel"],
      },
      {
        name: "Green Detox Smoothie",
        description: "Spinach, apple, cucumber, lemon, and ginger smoothie.",
        price: 4.99,
        category: "Drinks",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346265/lyfefuel-_82CV9I-TP8-unsplash_wrka52.jpg",
        isVegetarian: true,
        preparationTime: 5,
        tags: ["smoothie", "drink", "healthy"],
      },
      {
        name: "Avocado Salad",
        description:
          "Fresh salad with avocado, cherry tomatoes, cucumber, and seeds.",
        price: 8.49,
        category: "Salad",
        image:
          "https://res.cloudinary.com/db3rovvex/image/upload/v1783346266/mk-s-1hmOGCwDewU-unsplash_cvlm9i.jpg",
        isVegetarian: true,
        preparationTime: 10,
        tags: ["salad", "vegan", "healthy"],
      },
    ],
  },
];

const seedDemoRestaurants = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in server/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const ownerEmails = ownerUsers.map((owner) => owner.email);
    const restaurantEmails = restaurantTemplates.map(
      (restaurant) => restaurant.email,
    );

    const oldRestaurants = await Restaurant.find({
      email: { $in: restaurantEmails },
    }).select("_id");

    const oldRestaurantIds = oldRestaurants.map((restaurant) => restaurant._id);

    if (oldRestaurantIds.length > 0) {
      await FoodItem.deleteMany({ restaurant: { $in: oldRestaurantIds } });
      await Restaurant.deleteMany({ _id: { $in: oldRestaurantIds } });
    }

    await User.deleteMany({ email: { $in: ownerEmails } });

    const createdOwners = await User.create(ownerUsers);

    const ownerMap = new Map(
      createdOwners.map((owner) => [owner.email, owner]),
    );

    let restaurantCount = 0;
    let foodCount = 0;

    for (const template of restaurantTemplates) {
      const owner = ownerMap.get(template.ownerEmail);

      if (!owner) {
        throw new Error(`Owner not found for ${template.ownerEmail}`);
      }

      const restaurant = await Restaurant.create({
        owner: owner._id,
        name: template.name,
        description: template.description,
        phone: template.phone,
        email: template.email,
        address: template.address,
        city: template.city,
        cuisineTypes: template.cuisineTypes,
        logo: template.logo || demoImage(`${template.name} Logo`),
        coverImage: template.coverImage || demoImage(`${template.name} Cover`),
        ratingAverage: template.ratingAverage,
        ratingCount: template.ratingCount,
        minimumOrderAmount: template.minimumOrderAmount,
        deliveryFee: template.deliveryFee,
        estimatedDeliveryTime: template.estimatedDeliveryTime,
        openingHours: defaultOpeningHours,
        isApproved: true,
        isOpen: true,
        isActive: true,
        isTemporarilyClosed: false,
        temporaryClosedReason: "",
      });

      restaurantCount += 1;

      const foods = template.foods.map((food) => ({
        restaurant: restaurant._id,
        name: food.name,
        description: food.description,
        price: food.price,
        discountPrice: null,
        category: food.category,
        image: food.image || demoImage(food.name),
        isAvailable: true,
        isVegetarian: food.isVegetarian,
        preparationTime: food.preparationTime,
        tags: food.tags,
      }));

      await FoodItem.insertMany(foods);
      foodCount += foods.length;
    }

    console.log("Demo seed completed");
    console.log(`Owners created: ${createdOwners.length}`);
    console.log(`Restaurants created: ${restaurantCount}`);
    console.log(`Food items created: ${foodCount}`);

    console.log("\nDemo owner logins:");
    for (const owner of ownerUsers) {
      console.log(`${owner.email} / ${demoPassword}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Demo seed failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDemoRestaurants();
