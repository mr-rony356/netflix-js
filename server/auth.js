import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  // If the stored password doesn't contain a salt separator,
  // it may not be properly hashed (for debugging/development only)
  if (!stored.includes(".")) {
    console.log(
      "WARNING: Stored password is not in the expected format (hash.salt)"
    );
    // In development or debugging, you might want to compare directly
    // But in production, this would be a security risk
    return supplied === stored;
  }

  const [hashed, salt] = stored.split(".");

  if (!salt || !hashed) {
    console.log("ERROR: Invalid password format, missing salt or hash");
    return false;
  }

  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "netflix-clone-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 3600000, // 1 hour for "remember me"
      secure: process.env.NODE_ENV === "production",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          console.log(`Authenticating user: ${username}`);

          // Try to find user by username first
          let user = await storage.getUserByUsername(username);

          // If not found by username, try by email
          if (!user) {
            console.log(
              `User not found by username, trying email: ${username}`
            );
            user = await storage.getUserByEmail(username);
          }

          // If still not found and it looks like a phone number, try by phone
          if (!user && username.match(/^\+?[\d\s\(\)-]+$/)) {
            console.log(`User not found by email, trying phone: ${username}`);
            user = await storage.getUserByPhone(username);
          }

          if (!user) {
            console.log(`User not found with any identifier: ${username}`);
            return done(null, false);
          }

          console.log(`User found for: ${username}, comparing passwords...`);
          // For debugging only - never log actual passwords in production!
          console.log(`Supplied password length: ${password.length}`);
          console.log(
            `Stored password format: ${
              user.password.includes(".") ? "hashed" : "plain"
            }`
          );

          const passwordMatches = await comparePasswords(
            password,
            user.password
          );
          console.log(`Password comparison result: ${passwordMatches}`);

          if (!passwordMatches) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (error) {
          console.error("Error during authentication:", error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      if (req.body.phone) {
        const existingPhone = await storage.getUserByPhone(req.body.phone);
        if (existingPhone) {
          return res
            .status(400)
            .json({ message: "Phone number already exists" });
        }
      }

      // Create user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Login the user
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      // Add logging for debugging
      console.log("Login attempt for username:", req.body.username);

      passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user)
          return res.status(401).json({ message: "Invalid credentials" });

        req.login(user, (err) => {
          if (err) return next(err);
          return res.status(200).json(user);
        });
      })(req, res, next);
    } catch (error) {
      console.error("Login error:", error);
      return next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

export { hashPassword };
