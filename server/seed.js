// Fictional demo businesses at approximate downtown Ottawa coordinates.
import { ObjectId } from 'mongodb'
import { hashKey } from './app.js'

// shortcut: this demo owner key is public on purpose so interviewers can try the dashboard; real listings get random keys.
export const DEMO_OWNER = { id: '6a0000000000000000000001', key: 'demo-owner' }

const daysAgo = n => new Date(Date.now() - n * 864e5)
const review = (rating, confirmed, comment, days) => ({ rating, confirmed, comment, createdAt: daysAgo(days) })

export const seed = () => [
  {
    name: 'Maple & Main Café', location: { lat: 45.4211, lng: -75.7006 }, category: 'Café', address: '120 Bank St, Ottawa, ON',
    features: ['step_free', 'accessible_washroom', 'wide_aisles', 'seating', 'gluten_free', 'dairy_free', 'ingredient_list', 'written_comms'],
    reviews: [
      review(5, ['step_free', 'accessible_washroom', 'wide_aisles'], 'Automatic door and lots of room for my chair. Staff were lovely.', 3),
      review(4, ['gluten_free', 'ingredient_list'], 'They showed me the ingredient binder without me having to ask twice.', 12),
    ],
    requests: { quiet_space: 3, large_print: 1 },
  },
  {
    name: 'Quiet Leaf Books', location: { lat: 45.4227, lng: -75.6943 }, category: 'Bookstore', address: '45 Elgin St, Ottawa, ON',
    features: ['step_free', 'quiet_space', 'large_print', 'service_animals', 'clear_signage', 'seating'],
    reviews: [
      review(5, ['quiet_space', 'service_animals'], 'Tuesday morning quiet hours are perfect for my son.', 6),
      review(5, ['clear_signage', 'large_print'], 'As someone with dyslexia, the big picture-signs for each section make browsing so much less stressful.', 14),
    ],
    requests: { accessible_washroom: 2 },
  },
  {
    name: 'Harvest Table', location: { lat: 45.4298, lng: -75.6838 }, category: 'Restaurant', address: '310 Rideau St, Ottawa, ON',
    features: ['accessible_washroom', 'nut_free', 'gluten_free', 'dairy_free', 'ingredient_list', 'accessible_parking', 'plain_menu'],
    reviews: [
      review(4, ['nut_free', 'ingredient_list'], 'Fully nut-free kitchen. First place I have relaxed in years.', 2),
      review(3, ['accessible_parking'], 'There is one step at the side entrance, so use the front.', 20),
    ],
    requests: { step_free: 2, hearing_loop: 1 },
  },
  {
    name: 'Northside Fitness', location: { lat: 45.4062, lng: -75.7141 }, category: 'Gym', address: '88 Preston St, Ottawa, ON',
    features: ['step_free', 'accessible_washroom', 'accessible_parking', 'wide_aisles', 'captions'],
    reviews: [review(4, ['step_free', 'accessible_parking', 'captions'], 'The elevator to the second floor was working when I went, and every class screen has captions.', 9)],
    requests: { quiet_space: 4 },
  },
  {
    _id: new ObjectId(DEMO_OWNER.id), ownerKeyHash: hashKey(DEMO_OWNER.key),
    name: 'Little Dumpling House', location: { lat: 45.4178, lng: -75.689 }, category: 'Restaurant', address: '17 Somerset St W, Ottawa, ON',
    features: ['dairy_free', 'service_animals'],
    reviews: [review(2, [], 'Three steps at the door and no ramp. The food is great though.', 15)],
    requests: { step_free: 5, ingredient_list: 2, accessible_washroom: 1 },
  },
  {
    name: 'Corner Pharmacy', location: { lat: 45.4139, lng: -75.7083 }, category: 'Pharmacy', address: '200 Bronson Ave, Ottawa, ON',
    features: ['step_free', 'wide_aisles', 'large_print', 'accessible_parking', 'service_animals', 'written_comms', 'seating'],
    reviews: [],
    requests: {},
  },
  {
    name: 'Sunny Side Bakery', location: { lat: 45.4246, lng: -75.6978 }, category: 'Bakery', address: '9 Wellington St, Ottawa, ON',
    features: ['gluten_free', 'nut_free', 'ingredient_list', 'step_free'],
    reviews: [review(5, ['gluten_free', 'nut_free', 'step_free'], 'Dedicated gluten-free oven!', 1)],
    requests: { dairy_free: 3 },
  },
  {
    name: 'Riverside Cinema', location: { lat: 45.4319, lng: -75.6951 }, category: 'Entertainment', address: '500 Sussex Dr, Ottawa, ON',
    features: ['step_free', 'accessible_washroom', 'quiet_space', 'accessible_parking', 'wide_aisles', 'captions', 'hearing_loop'],
    reviews: [
      review(4, ['quiet_space', 'accessible_washroom'], 'Sensory-friendly screenings on Sundays, with the lights up and the sound down.', 7),
      review(5, ['captions', 'hearing_loop'], 'Captioned showings every night, and the hearing loop worked with my hearing aids. Finally!', 4),
    ],
    requests: {},
  },
]
