import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { ThemeProvider } from './context/ThemeContext.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import WaitlistPage from './pages/WaitlistPage.jsx'

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
          <Route path="waitlist" element={<WaitlistPage />} />
          <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
