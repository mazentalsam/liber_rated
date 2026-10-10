// Single source of truth for features: the server validates against it, the client renders it.
export const FEATURES = [
  { key: 'step_free', group: 'mobility', label: 'Step-free entrance', tip: 'A portable ramp costs less than a day of lost customers. Add a doorbell at the entrance so people can ask for it.' },
  { key: 'accessible_washroom', group: 'mobility', label: 'Accessible washroom', tip: 'Grab bars, a 1.5 m turning circle, and a lever handle on the door cover most needs.' },
  { key: 'wide_aisles', group: 'mobility', label: 'Wide aisles (90 cm+)', tip: 'Move a display or two so a wheelchair or stroller can get through.' },
  { key: 'accessible_parking', group: 'mobility', label: 'Accessible parking', tip: 'Mark one spot near the door, and post where the nearest accessible parking is.' },
  { key: 'seating', group: 'mobility', label: 'Seating to rest', tip: 'A chair by the entrance or the checkout helps anyone with chronic pain or fatigue.' },
  { key: 'large_print', group: 'sensory', label: 'Braille or large-print menu', tip: 'A large-print menu is one printout away. A QR code to a screen-reader-friendly menu helps too.' },
  { key: 'hearing_loop', group: 'sensory', label: 'Hearing loop', tip: 'A portable counter hearing loop costs a few hundred dollars and works with most hearing aids.' },
  { key: 'captions', group: 'sensory', label: 'Captions on screens', tip: 'Turn on captions on every TV and video you show. It takes no extra setup.' },
  { key: 'written_comms', group: 'sensory', label: 'Staff can communicate in writing', tip: 'Keep a notepad or tablet at the counter, and train staff to offer it without making a fuss.' },
  { key: 'service_animals', group: 'sensory', label: 'Service animals welcome', tip: 'Put a decal on the door and brief your staff. Service animals are protected under Canadian human rights law.' },
  { key: 'quiet_space', group: 'cognitive', label: 'Quiet / low-sensory hours', tip: 'One hour a week with lower music and lights is a strong welcome for autistic and sensory-sensitive visitors.' },
  { key: 'clear_signage', group: 'cognitive', label: 'Clear, simple signage', tip: 'Large, high-contrast signs with icons help people with ADHD, dyslexia, or memory challenges, and everyone else.' },
  { key: 'plain_menu', group: 'cognitive', label: 'Plain-language or picture menu', tip: 'Short descriptions and photos make ordering easier for people with learning disabilities and newcomers alike.' },
  { key: 'gluten_free', group: 'allergen', label: 'Gluten-free options', tip: 'Even one dish, prepared on separate surfaces, brings in a loyal crowd.' },
  { key: 'nut_free', group: 'allergen', label: 'Nut-free kitchen', tip: "If you can't be nut-free, say clearly which items are prepared near nuts." },
  { key: 'dairy_free', group: 'allergen', label: 'Dairy-free options', tip: 'Oat milk and one dairy-free main cover most requests.' },
  { key: 'ingredient_list', group: 'allergen', label: 'Full ingredient lists', tip: 'Keep a binder or web page listing the ingredients of every item so staff never have to guess.' },
]

export const GROUPS = {
  mobility: 'Mobility',
  sensory: 'Sight, hearing & communication',
  cognitive: 'Cognitive & sensory comfort',
  allergen: 'Allergens',
}
