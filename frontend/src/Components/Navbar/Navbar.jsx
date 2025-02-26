import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { auth } from '../../Config/firebaseConfig'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './Navbar.css';
import sarangi_web_logo from '../assets/sarangi_web_logo.png'
// import logo from '../assets/logo-removebg-preview.png';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          console.log('Auth state changed:', currentUser);
            setUser(currentUser);
        });
        
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth); 
            setUser(null);
            alert('Logged out successfully!');
            window.location.replace('/signup');
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Error logging out: ' + error.message);
        }
    };

    return (
        <nav style={{ color:'orange' }} className="navbar">
            <div className="navbar-logo">
                <img src={sarangi_web_logo} alt="GameZone Logo" style={{ height: '70px', width: '150px' , marginTop : '5px' }} /> 
                <p style={{ marginTop: '5px', color: '#ffffff', fontSize: '1rem' }}>BallerCards</p> 
            </div>
            <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
                <li><a href="/">Home</a></li>
                <li><a href="/services">Services</a></li>
                <li><a href="https://discord.gg/vuVGWbGx">Community</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/rules">Rules</a></li>
            </div>
            <div className="signup-button">
                {user ? (
                    <button onClick={handleLogout}>Logout</button> 
                ) : (
                    <Link to='/signup'>
                        <button>Login</button> 
                    </Link>
                )}
            </div>
            <div className="hamburger" onClick={toggleMenu}>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </nav>
    );
};

export default Navbar;



