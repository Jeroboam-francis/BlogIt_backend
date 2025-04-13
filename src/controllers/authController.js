import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

// Register a new user
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    // Check if user exists
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
      },
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Check for user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get current user profile
export const getMe = async (req, res) => {
  res.json(req.user);
};
