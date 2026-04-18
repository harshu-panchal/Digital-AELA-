import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaMinus,
  FaPlus,
  FaShoppingCart,
  FaTrash,
  FaGift,
} from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import TranslatedText from "../../../src/components/TranslatedText";
import LazyImage from "../../../src/components/LazyImage";
import { getMediaUrl } from "../../../src/utils/mediaUrl";
import { formatCurrency } from "../../../src/utils/currencyUtils";
import {
  clearBookCart,
  getBookCartTotals,
  readBookCart,
  removeBookFromCart,
  subscribeToBookCart,
  updateBookCartItemQuantity,
} from "../utils/bookCart";

const BookCart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState(() => readBookCart());
  const [giftSelectionOpen, setGiftSelectionOpen] = useState(false);
  const [showNearGiftForm, setShowNearGiftForm] = useState(false);
  const [nearGiftForm, setNearGiftForm] = useState({
    userId: "",
    fullName: "",
    email: "",
    phone: "",
    relation: "",
    location: "",
    message: "",
  });
  const [nearGiftErrors, setNearGiftErrors] = useState({});

  useEffect(() => subscribeToBookCart(setItems), []);

  const totals = useMemo(() => getBookCartTotals(items), [items]);
  const hasAfterlifeItems = items.some(
    (item) => item.origin === "join-build-afterlife"
  );

  const handleQuantityChange = (bookId, quantity) => {
    setItems(updateBookCartItemQuantity(bookId, quantity));
  };

  const handleRemove = (bookId) => {
    setItems(removeBookFromCart(bookId));
  };

  const handleClear = () => {
    if (!window.confirm("Remove all books from your cart?")) return;
    clearBookCart();
    setItems([]);
  };

  const handleNearGiftChange = (field, value) => {
    setNearGiftForm((currentForm) => ({ ...currentForm, [field]: value }));
    if (nearGiftErrors[field]) {
      setNearGiftErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
      }));
    }
  };

  const getCheckoutState = (extraState = {}) => ({
    type: "book-cart",
    itemName:
      items.length === 1
        ? items[0].title
        : `${items.length} books from Digital AELA`,
    itemId: items.map((item) => item.id).join(","),
    amount: totals.amount,
    currency: "INR",
    quantity: totals.quantity,
    description: "Multi-book cart purchase",
    cartItems: items,
    source:
      hasAfterlifeItems && items.every((item) => item.origin === "join-build-afterlife")
        ? "join-build-afterlife"
        : hasAfterlifeItems
        ? "mixed-afterlife-cart"
        : "book-cart",
    ...extraState,
  });

  const handleCheckout = (extraState = {}) => {
    if (items.length === 0 || totals.amount <= 0) return;

    navigate("/payment/confirm", {
      state: getCheckoutState(extraState),
    });
  };

  const handleGiftAll = () => {
    setGiftSelectionOpen(true);
    setShowNearGiftForm(false);
  };

  const handleGiftAnyone = () => {
    handleCheckout({
      giftType: "anyone",
      description: "Gift all books to anyone",
    });
  };

  const handleNearGiftSubmit = (event) => {
    event.preventDefault();

    const errors = {};
    if (!nearGiftForm.userId.trim()) {
      errors.userId = "User ID is required";
    }
    if (!nearGiftForm.fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (Object.keys(errors).length > 0) {
      setNearGiftErrors(errors);
      return;
    }

    handleCheckout({
      giftType: "near",
      description: `Gift all books to ${nearGiftForm.fullName.trim()}`,
      recipientDetails: {
        userId: nearGiftForm.userId.trim(),
        fullName: nearGiftForm.fullName.trim(),
        email: nearGiftForm.email.trim(),
        phone: nearGiftForm.phone.trim(),
        relation: nearGiftForm.relation.trim(),
        location: nearGiftForm.location.trim(),
        message: nearGiftForm.message.trim(),
      },
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title="Book Cart | Digital AELA"
        description="Review your selected Digital AELA books and complete one secure checkout."
        keywords="Digital AELA book cart, buy books, book checkout"
        url="https://digitalaela.com/books/cart"
      />

      <section className="relative overflow-hidden pt-[120px] pb-10 md:pt-[150px] md:pb-12">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <Link
            to="/books"
            className="mb-6 inline-flex items-center gap-2 text-[#D4AF37] transition-colors hover:text-[#E5C158]">
            <FaArrowLeft className="h-4 w-4" />
            <span>
              <TranslatedText>Continue Shopping</TranslatedText>
            </span>
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#D4AF37]/80">
                <TranslatedText>Book Store</TranslatedText>
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white md:text-5xl">
                <TranslatedText>Your Book Cart</TranslatedText>
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-400">
                <TranslatedText>
                  Select quantities and purchase multiple books in one secure
                  checkout.
                </TranslatedText>
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={handleClear}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/10">
                <FaTrash className="h-4 w-4" />
                <TranslatedText>Clear Cart</TranslatedText>
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#141414] py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-10 text-center">
                <FaShoppingCart className="mx-auto mb-4 h-12 w-12 text-[#D4AF37]" />
                <h2 className="text-2xl font-bold">
                  <TranslatedText>Your cart is empty</TranslatedText>
                </h2>
                <p className="mt-2 text-gray-400">
                  <TranslatedText>
                    Add books from the store and they will appear here.
                  </TranslatedText>
                </p>
                <Link
                  to="/books"
                  className="mt-6 inline-flex rounded-lg bg-[#D4AF37] px-5 py-3 font-bold text-black transition hover:bg-[#E5C158]">
                  <TranslatedText>Browse Books</TranslatedText>
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-4 md:p-5">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <Link
                      to={`/books/${item.id}`}
                      className="h-36 w-full overflow-hidden rounded-xl border border-white/10 bg-[#141414] md:w-28">
                      <LazyImage
                        src={getMediaUrl(item.image)}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        fallbackSrc="https://via.placeholder.com/160x220?text=Book"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <Link
                            to={`/books/${item.id}`}
                            className="text-lg font-bold text-white transition hover:text-[#D4AF37]">
                            {item.title}
                          </Link>
                          <p className="mt-1 text-sm text-gray-400">
                            <TranslatedText>by</TranslatedText> {item.author}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#D4AF37]/80">
                            {item.format === "physical" ? "Physical Book" : "E-Book"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="inline-flex items-center gap-2 self-start rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10">
                          <FaTrash className="h-3 w-3" />
                          <TranslatedText>Remove</TranslatedText>
                        </button>
                      </div>

                      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="inline-flex w-max items-center rounded-lg border border-white/10 bg-[#141414]">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            className="px-3 py-2 text-[#D4AF37] transition hover:bg-white/5">
                            <FaMinus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={item.quantity}
                            onChange={(event) =>
                              handleQuantityChange(item.id, event.target.value)
                            }
                            className="w-14 border-x border-white/10 bg-transparent py-2 text-center text-white focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            className="px-3 py-2 text-[#D4AF37] transition hover:bg-white/5">
                            <FaPlus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-400">
                            {formatCurrency(item.price)} x {item.quantity}
                          </p>
                          <p className="text-xl font-bold text-[#D4AF37]">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))
            )}
          </div>

          <aside className="h-max rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-6 lg:sticky lg:top-28">
            <h2 className="text-xl font-bold">
              <TranslatedText>Order Summary</TranslatedText>
            </h2>
            <div className="mt-5 space-y-3 border-b border-white/10 pb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  <TranslatedText>Books</TranslatedText>
                </span>
                <span className="font-semibold text-white">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  <TranslatedText>Total Quantity</TranslatedText>
                </span>
                <span className="font-semibold text-white">{totals.quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  <TranslatedText>Shipping</TranslatedText>
                </span>
                <span className="font-semibold text-white">
                  <TranslatedText>Free</TranslatedText>
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-lg font-bold">
                <TranslatedText>Total</TranslatedText>
              </span>
              <span className="text-2xl font-bold text-[#D4AF37]">
                {formatCurrency(totals.amount)}
              </span>
            </div>
            {hasAfterlifeItems ? (
              <div className="mt-6 space-y-3">
                <div className="rounded-xl border border-[#D4AF37]/20 bg-[#141414] p-4">
                  <div className="flex items-start gap-3">
                    <FaGift className="mt-1 h-4 w-4 text-[#D4AF37]" />
                    <div>
                      <p className="text-sm font-bold text-white">
                        <TranslatedText>Afterlife Cart Checkout</TranslatedText>
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        <TranslatedText>
                          Choose whether these books are for you or a gift.
                        </TranslatedText>
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout()}
                  disabled={items.length === 0 || totals.amount <= 0}
                  className="w-full rounded-lg bg-[#D4AF37] px-5 py-3 font-bold text-black transition hover:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-50">
                  <TranslatedText>Purchase for Yourself</TranslatedText>
                </button>
                <button
                  onClick={handleGiftAll}
                  disabled={items.length === 0 || totals.amount <= 0}
                  className="w-full rounded-lg border border-[#D4AF37]/60 px-5 py-3 font-bold text-[#F5D26A] transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50">
                  <TranslatedText>Gift All</TranslatedText>
                </button>

                {giftSelectionOpen && (
                  <div className="space-y-3 rounded-xl border border-[#D4AF37]/20 bg-[#141414] p-4">
                    <p className="text-sm font-bold text-white">
                      <TranslatedText>Choose Gift Type</TranslatedText>
                    </p>
                    <button
                      onClick={() => setShowNearGiftForm(true)}
                      className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37]">
                      <TranslatedText>Gift Near One</TranslatedText>
                    </button>
                    <button
                      onClick={handleGiftAnyone}
                      className="w-full rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#E5C158]">
                      <TranslatedText>Gift Anyone</TranslatedText>
                    </button>
                  </div>
                )}

                {showNearGiftForm && (
                  <form
                    onSubmit={handleNearGiftSubmit}
                    className="space-y-3 rounded-xl border border-[#D4AF37]/20 bg-[#141414] p-4">
                    <p className="text-sm font-bold text-white">
                      <TranslatedText>Near One Details</TranslatedText>
                    </p>
                    <div>
                      <input
                        type="text"
                        value={nearGiftForm.userId}
                        onChange={(event) =>
                          handleNearGiftChange("userId", event.target.value)
                        }
                        placeholder="Recipient user ID"
                        className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                      />
                      {nearGiftErrors.userId && (
                        <p className="mt-1 text-xs text-red-300">
                          {nearGiftErrors.userId}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={nearGiftForm.fullName}
                        onChange={(event) =>
                          handleNearGiftChange("fullName", event.target.value)
                        }
                        placeholder="Recipient full name"
                        className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                      />
                      {nearGiftErrors.fullName && (
                        <p className="mt-1 text-xs text-red-300">
                          {nearGiftErrors.fullName}
                        </p>
                      )}
                    </div>
                    <input
                      type="email"
                      value={nearGiftForm.email}
                      onChange={(event) =>
                        handleNearGiftChange("email", event.target.value)
                      }
                      placeholder="Recipient email (optional)"
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                    />
                    <input
                      type="tel"
                      value={nearGiftForm.phone}
                      onChange={(event) =>
                        handleNearGiftChange("phone", event.target.value)
                      }
                      placeholder="Recipient phone (optional)"
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={nearGiftForm.relation}
                      onChange={(event) =>
                        handleNearGiftChange("relation", event.target.value)
                      }
                      placeholder="Relation (optional)"
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={nearGiftForm.location}
                      onChange={(event) =>
                        handleNearGiftChange("location", event.target.value)
                      }
                      placeholder="Location (optional)"
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                    />
                    <textarea
                      value={nearGiftForm.message}
                      onChange={(event) =>
                        handleNearGiftChange("message", event.target.value)
                      }
                      placeholder="Gift message (optional)"
                      rows={3}
                      className="w-full resize-none rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#E5C158]">
                      <TranslatedText>Continue to Payment</TranslatedText>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleCheckout()}
                disabled={items.length === 0 || totals.amount <= 0}
                className="mt-6 w-full rounded-lg bg-[#D4AF37] px-5 py-3 font-bold text-black transition hover:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-50">
                <TranslatedText>Checkout All Books</TranslatedText>
              </button>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
};

export default BookCart;
