const BOOK_CART_STORAGE_KEY = "aela.book.cart";
const BOOK_CART_EVENT = "aela:book-cart-updated";
export const BOOK_CART_PENDING_PAYMENT_KEY = "aela.pending-book-cart-payment";

const parsePrice = (price) => {
  if (typeof price === "number") return Number.isFinite(price) ? price : 0;
  if (typeof price === "string") {
    return parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
  }
  return 0;
};

const normalizeQuantity = (quantity) => {
  const parsed = parseInt(quantity, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 99);
};

const normalizeBook = (book, quantity = 1) => ({
  id: book.id || book._id,
  title: book.title || "Untitled Book",
  author: book.author || book.metadata?.author || "Digital AELA",
  price: parsePrice(book.rawPrice ?? book.price ?? book.metadata?.price),
  currency: book.currency || "INR",
  quantity: normalizeQuantity(quantity),
  image: book.image || book.metadata?.coverImage || "",
  format: book.format || book.metadata?.bookType || "ebook",
  category: book.category || book.categories?.[0] || "General",
  description: book.shortDescription || book.description || "",
});

export const readBookCart = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BOOK_CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.id).map((item) => normalizeBook(item, item.quantity))
      : [];
  } catch {
    return [];
  }
};

const writeBookCart = (items) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(BOOK_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(BOOK_CART_EVENT, { detail: items }));
};

export const addBookToCart = (book, quantity = 1) => {
  const normalizedBook = normalizeBook(book, quantity);
  const items = readBookCart();
  const existingIndex = items.findIndex((item) => item.id === normalizedBook.id);

  if (existingIndex >= 0) {
    const existingQuantity = normalizeQuantity(items[existingIndex].quantity);

    items[existingIndex] = {
      ...items[existingIndex],
      ...normalizedBook,
      quantity: normalizeQuantity(existingQuantity + normalizedBook.quantity),
    };
  } else {
    items.push(normalizedBook);
  }

  writeBookCart(items);
  return items;
};

export const updateBookCartItemQuantity = (bookId, quantity) => {
  const nextQuantity = normalizeQuantity(quantity);
  const items = readBookCart().map((item) =>
    item.id === bookId ? { ...item, quantity: nextQuantity } : item
  );

  writeBookCart(items);
  return items;
};

export const removeBookFromCart = (bookId) => {
  const items = readBookCart().filter((item) => item.id !== bookId);
  writeBookCart(items);
  return items;
};

export const clearBookCart = () => {
  writeBookCart([]);
};

export const getBookCartTotals = (items = readBookCart()) => {
  return items.reduce(
    (totals, item) => {
      const quantity = normalizeQuantity(item.quantity);
      const price = parsePrice(item.price);
      return {
        quantity: totals.quantity + quantity,
        amount: totals.amount + price * quantity,
      };
    },
    { quantity: 0, amount: 0 }
  );
};

export const subscribeToBookCart = (callback) => {
  if (typeof window === "undefined") return () => {};

  const handler = () => callback(readBookCart());
  window.addEventListener(BOOK_CART_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(BOOK_CART_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
};
