/**
 * General Middleware Utilities
 *
 * Contains reusable middleware functions for role-based access control
 * and other common authentication/authorization patterns.
 */

// Role-based access control middleware factory
export const requireRole = (roles) => {
    return (req, res, next) => {
      // Check if user's role is in the allowed roles array
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    };
  };

// Example usage:
// app.get('/admin/dashboard', requireRole(['super_admin', 'manager']), adminDashboardHandler);
