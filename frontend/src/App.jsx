import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { ThemeProvider } from './context/ThemeContext.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route index element={<Navigate to="/register" replace />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="login" element={<LoginPage />} />
          </Route>
          <Route path="waitlist" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard-preview" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
