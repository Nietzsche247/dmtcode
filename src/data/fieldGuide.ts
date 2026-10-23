export const FIELD_GUIDE = {
  id: 'field-guide',
  name: 'DMT Laser Code Field Guide (PDF)',
  image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/dmt-laser-code-field-guide-cover.jpg?v=1792772893',
  price: '$15',
  cart: 'https://shop.dmtcode.com/cart/67786715365686:1',
  description: 'A 23 page printable guide for running and recording the sober observation procedure: screening, laser class and eye safety, room setup, the step by step procedure, a printable session log sheet, and how to read and submit to the open symbol registry. It does not say what you will see and it does not describe substance use. PDF, US Letter, delivered by email after checkout.',
} as const;
export const FIELD_GUIDE_LIVE = !FIELD_GUIDE.price.includes('{{') && !FIELD_GUIDE.cart.includes('{{');
