import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { Trading } from './pages/Trading';
import { News } from './pages/News';
import { Articles } from './pages/Articles';
import { Stocks } from './pages/Stocks';
import './App.css';

function AppContent() {
    const [showAuthModal, setShowAuthModal] = useState(false);

    return (
        <div className="app">
            <Navbar onOpenAuth={() => setShowAuthModal(true)} />

            <Routes>
                <Route path="/" element={<Trading />} />
                <Route path="/news" element={<News />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/stocks" element={<Stocks />} />
            </Routes>

            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

