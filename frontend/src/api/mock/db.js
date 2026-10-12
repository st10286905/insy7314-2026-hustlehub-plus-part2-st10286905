export function newId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString() }

export const users = [
    { id: 'u1', name: 'Connor Dlamini', email: 'connor@example.com', password: 'Password1!', role: 'client', createdAt: daysAgo(30) },
    { id: 'u2', name: 'Jessica Mokoena', email: 'jessica@example.com', password: 'Password1!', role: 'freelancer', createdAt: daysAgo(25) },
    { id: 'u3', name: 'Admin User', email: 'admin@hustlehub.example.com', password: 'Password1!', role: 'admin', createdAt: daysAgo(60) },
    { id: 'u4', name: 'Lyle Nkosi', email: 'lyle@example.com', password: 'Password1!', role: 'client', createdAt: daysAgo(10) },
    { id: 'u5', name: 'Skye Pietersen', email: 'skye@example.com', password: 'Password1!', role: 'freelancer', createdAt: daysAgo(15) },
]

export const gigs = [
    { id: 'g1', title: 'Logo Design', category: 'Design', description: 'Professional logo design for your brand.', rate: 1500, durationHours: 8, status: 'Active', freelancer: 'u2', createdAt: daysAgo(20) },
    { id: 'g2', title: 'React Frontend Development', category: 'Development', description: 'Build a React app from scratch.', rate: 5000, durationHours: 40, status: 'Active', freelancer: 'u2', createdAt: daysAgo(18) },
    { id: 'g3', title: 'Blog Writing (5 posts)', category: 'Writing', description: 'SEO-optimised blog posts for your site.', rate: 800, durationHours: 6, status: 'Active', freelancer: 'u5', createdAt: daysAgo(12) },
    { id: 'g4', title: 'Social Media Marketing', category: 'Marketing', description: 'Grow your following with targeted campaigns.', rate: 2200, durationHours: 16, status: 'Active', freelancer: 'u5', createdAt: daysAgo(8) },
    { id: 'g5', title: 'UI/UX Wireframing', category: 'Design', description: 'Figma wireframes for your app.', rate: 3000, durationHours: 20, status: 'Paused', freelancer: 'u2', createdAt: daysAgo(5) },
]

export const bookings = [
    { id: 'b1', gig: 'g1', client: 'u1', freelancer: 'u2', status: 'Completed', notes: '', createdAt: daysAgo(15) },
    { id: 'b2', gig: 'g2', client: 'u4', freelancer: 'u2', status: 'Confirmed', notes: '', createdAt: daysAgo(5) },
    { id: 'b3', gig: 'g3', client: 'u1', freelancer: 'u5', status: 'Pending', notes: '', createdAt: daysAgo(2) },
]

export const transactions = [
    { id: 't1', booking: 'b1', client: 'u1', freelancer: 'u2', amount: 1500, status: 'Completed', createdAt: daysAgo(15) },
    { id: 't2', booking: 'b2', client: 'u4', freelancer: 'u2', amount: 5000, status: 'Confirmed', createdAt: daysAgo(5) },
]

export function addBooking({ gig, client, status, notes, createdAt }) {
    const id = newId()
    const txId = newId()
    const booking = { id, gig: gig.id, client: client.id, freelancer: gig.freelancer, status, notes, createdAt }
    const tx = { id: txId, booking: id, client: client.id, freelancer: gig.freelancer, amount: gig.rate, status, createdAt }
    bookings.push(booking)
    transactions.push(tx)
    return { b: booking, t: tx }
}