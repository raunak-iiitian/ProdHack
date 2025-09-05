import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Timer, Zap, Trophy, Users, Sparkles } from "lucide-react";
import logo from "./assets/logo.svg";
import "./ProdHackHomePage.css";

// Data for features, stats, and footer links
const featuresData = [
    { icon: Timer, title: "Smart Timer Sessions", description: "Pomodoro technique enhanced with AI-powered break suggestions and focus optimization.", color: "feature-pink" },
    { icon: Trophy, title: "Competitive Battles", description: "Challenge friends and colleagues in productivity battles with real-time leaderboards.", color: "feature-blue" },
    { icon: Zap, title: "Achievement System", description: "Unlock badges, level up your productivity stats, and track your growth over time.", color: "feature-yellow" },
];

const statsData = [
    { number: "50K+", label: "Active Users" },
    { number: "2M+", label: "Sessions Completed" },
    { number: "95%", label: "Productivity Increase" },
];

const footerSections = [
    { title: "Product", links: ["Features", "Pricing", "Updates", "Beta"] },
    { title: "Community", links: ["Discord", "Forums", "Leaderboards", "Events"] },
    { title: "Support", links: ["Help Center", "Contact", "Bug Reports", "Feature Requests"] },
];


export default function ProdHackHomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = {
    "1 vs 1": "/OneOne",
    "Theme Store": "/theme-store",
    "Leaderboard": "/leaderboard",
    "About Us": "/about-us",
  };
  
  const navItems = Object.keys(navLinks);

  return (
    <div className="homepage">
      <header className={`header ${isScrolled ? "header-scrolled" : ""}`}>
        <div className="header-container">
          <div className="logo">
            <img src={logo} alt="ProdHack Logo" className="logo-img" />
          </div>
          <h1>ProdHack</h1>
          <nav className="nav">
            {navItems.map((item) => (
              <NavLink key={item} to={navLinks[item]} className="nav-link">
                {item}
                <span className="nav-underline"></span>
              </NavLink>
            ))}
            <button className="btn-primary">Login/Sign Up</button>
          </nav>
        </div>
      </header>
      
      <main className="main">
        <section className="hero">
          <div className="hero-title-container">
            <h1 className="hero-title">
              Hack Your <span className="gradient-text">Productivity</span>
            </h1>
          </div>
          <p className="hero-subtitle">
            Transform your work sessions into competitive battles. Timer
            sessions, leaderboards, and achievement systems that make
            productivity addictive.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary pulse">
              <Sparkles className="inline-icon" /> Start Hacking Now
            </button>
            <button className="btn-secondary">Watch Demo</button>
          </div>
          <div className="features">
            {featuresData.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className={`feature-icon ${feature.color}`}>
                  <feature.icon className="icon-white" />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="stats">
          <div className="stats-container">
            <h2 className="stats-title">Join the Productivity Revolution</h2>
            <div className="stats-grid">
              {statsData.map((stat, index) => (
                <div key={index} className="stat">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="cta-container">
            <h2 className="cta-title">Ready to Level Up?</h2>
            <p className="cta-subtitle">
              Join thousands of productivity hackers who've transformed their
              work habits into an exciting game.
            </p>
            <button className="btn-primary pulse">
              <Users className="inline-icon-lg" /> Join ProdHack Today
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-about">
              <div className="footer-logo">
                <img src={logo} alt="ProdHack Logo" className="logo-img" />
                <h2>ProdHack</h2>
              </div>
              <p className="footer-text">
                Revolutionizing productivity through gamification and
                competitive engagement.
              </p>
            </div>
            {footerSections.map((section, index) => (
              <div key={index}>
                <h4 className="footer-title">{section.title}</h4>
                <ul className="footer-links">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="footer-link">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">
              © 2025 ProdHack. Made with 💜 for productive humans.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}