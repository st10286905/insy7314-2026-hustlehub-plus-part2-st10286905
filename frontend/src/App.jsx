import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import GuestRoute from './components/GuestRoute'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BrowseGigsPage from './pages/BrowseGigsPage'
import GigDetailPage from './pages/GigDetailPage'
import BookingConfirmedPage from './pages/BookingConfirmedPage'
import MyBookingsPage from './pages/MyBookingsPage'
import MyGigsPage from './pages/MyGigsPage'
import CreateGigPage from './pages/CreateGigPage'
import BookingsIncomePage from './pages/BookingsIncomePage'
import AdminPage from './pages/AdminPage'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Guest only - no layout */}
                    <Route element={<GuestRoute />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                    </Route>

                    {/* All authenticated routes get the Layout (navbar) */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/gigs" element={<BrowseGigsPage />} />
                            <Route path="/gigs/:id" element={<GigDetailPage />} />
                            <Route path="/booking-confirmed/:id" element={<BookingConfirmedPage />} />

                            {/* Client only */}
                            <Route element={<RoleRoute roles={['client']} />}>
                                <Route path="/my-bookings" element={<MyBookingsPage />} />
                            </Route>

                            {/* Freelancer only */}
                            <Route element={<RoleRoute roles={['freelancer']} />}>
                                <Route path="/my-gigs" element={<MyGigsPage />} />
                                <Route path="/my-gigs/create" element={<CreateGigPage />} />
                                <Route path="/bookings-income" element={<BookingsIncomePage />} />
                            </Route>

                            {/* Admin only */}
                            <Route element={<RoleRoute roles={['admin']} />}>
                                <Route path="/admin" element={<AdminPage />} />
                            </Route>
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App