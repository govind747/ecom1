## Packages
zustand | State management for the shopping cart
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging tailwind classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  sans: ["var(--font-sans)"],
}
Requires loading Razorpay script dynamically for checkout.
Price in database is in paise, needs to be divided by 100 for display.
