import { Link } from 'react-router-dom';
import { Activity, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';

const WS_URL = 'ws://localhost:8000';

export function Navbar({ onOpenAuth }: { onOpenAuth: () => void }) {
    const { user, logout, isAuthenticated } = useAuth();
    const { isConnected } = useWebSocket(WS_URL);

    return (
        <header className="app-header">
            <div className="header-left">
                <Link to="/" className="logo">
                    <Activity size={24} />
                    <span>Crypt Configs</span>
                </Link>
                <nav className="main-nav">
                    <Link to="/" className="nav-link">Trading</Link>
                    <Link to="/news" className="nav-link">News</Link>
                    <Link to="/articles" className="nav-link">Articles</Link>
                    <Link to="/stocks" className="nav-link">Stocks</Link>
                </nav>
            </div>

            <div className="header-right">
                <div className="connection-status">
                    <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
                    <span>{isConnected ? 'Live' : 'Connecting...'}</span>
                </div>

                {isAuthenticated && user ? (
                    <div className="user-menu">
                        <UserIcon size={18} />
                        <span>{user.username}</span>
                        <button onClick={logout} className="btn-logout">
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <button onClick={onOpenAuth} className="btn-login">
                        <LogIn size={16} />
                        <span>Login</span>
                    </button>
                )}
            </div>
        </header>
    );
}
