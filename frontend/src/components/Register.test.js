import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Register from "./Register";
import authService from "../services/authService";

// Mock the authService
jest.mock("../services/authService", () => ({
  register: jest.fn(),
  login: jest.fn(),
}));

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

describe("Register Component", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test("renders registration form correctly", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    // Check if the form elements are rendered
    expect(screen.getByText("Create an Account")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Already have an account?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  test("validates matching passwords", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    // Fill in the form with mismatched passwords
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "newuser" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "newuser@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password456" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // Check for password mismatch error
    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  test("submits registration form with valid data", async () => {
    authService.register.mockResolvedValueOnce({});
    authService.login.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    // Fill in the form with valid data
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "newuser" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "newuser@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // Check if registration and login were called with correct values
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith(
        "newuser",
        "newuser@example.com",
        "password123",
        "password123",
      );
      expect(authService.login).toHaveBeenCalledWith("newuser", "password123");
      expect(mockedNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("shows error when registration fails", async () => {
    // Mock register function to reject with an error
    authService.register.mockRejectedValueOnce({
      username: ["Username already exists"],
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "existinguser" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(
        screen.getByText("Username error: Username already exists"),
      ).toBeInTheDocument();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  test("button changes to loading state during submission", async () => {
    // Mock register with a delay to test loading state
    authService.register.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100)),
    );
    authService.login.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "newuser" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "newuser@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // Check if button text changes to "Creating Account..."
    expect(
      screen.getByRole("button", { name: /creating account/i }),
    ).toBeInTheDocument();

    // Wait for the registration to complete
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
    });
  });
});
