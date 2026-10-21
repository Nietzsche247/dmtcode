export const FIELD_GUIDE = {
  id: 'field-guide',
  name: 'DMT Laser Code Field Guide (PDF)',
  price: '{{FIELD_GUIDE_PRICE}}',
  cart: 'https://shop.dmtcode.com/cart/{{FIELD_GUIDE_VARIANT_ID}}:1',
  description: 'A printable field guide for running and recording an observation: screening, setup, the field sheet, and how to submit a record so it counts. Digital download, delivered by email after checkout. It is a procedure document, not a key to the symbols and not a claim about what they mean.',
} as const;
export const FIELD_GUIDE_LIVE = !FIELD_GUIDE.price.includes('{{') && !FIELD_GUIDE.cart.includes('{{');
