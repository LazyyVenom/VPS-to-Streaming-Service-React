import { useState, useEffect } from "react";
import type { User } from "../api/usersApi";
import { loginUser, storeTokens } from "../api/authApi";
import { AiOutlineClose } from "react-icons/ai";
import { BiLock } from "react-icons/bi";
import "./LoginModal.css";

interface LoginModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const LoginModal = ({ user, onClose, onSuccess }: LoginModalProps) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-login for Guest user
  useEffect(() => {
    const isGuestUser =
      user.name.toLowerCase() === "guest" ||
      user.name.toLowerCase() === "guest user";

    if (isGuestUser) {
      // Automatically set password and login
      const guestPassword = "12345678";
      setPassword(guestPassword);

      // Auto-submit after a short delay for better UX
      const timer = setTimeout(async () => {
        setLoading(true);
        setError("");

        try {
          const response = await loginUser({
            username: user.name,
            password: guestPassword,
          });

          storeTokens(response);
          console.log("Guest auto-login successful:", response);
          onSuccess();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Auto-login failed");
          console.error("Guest auto-login error:", err);
          setLoading(false);
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [user, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser({
        username: user.name,
        password: password,
      });

      // Store tokens
      storeTokens(response);

      // Success
      console.log("Login successful:", response);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="login-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-modal">
        <button className="close-button" onClick={onClose}>
          <AiOutlineClose />
        </button>

        <div className="login-modal-content">
          <div className="user-info">
            <img
              src={user.avatar}
              alt={user.name}
              className="user-avatar-modal"
            />
            <h2>{user.name}</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <BiLock className="input-icon" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="password-input"
                autoFocus
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
