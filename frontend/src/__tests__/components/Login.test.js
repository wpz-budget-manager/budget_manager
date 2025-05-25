import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "../../components/Login";
import authService from "../../services/authService";

// Mock the authService
jest.mock("../../services/authService", () => ({
  login: jest.fn(),
}));

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

// React Router future flags configuration
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

describe("Login Component", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test("renders login form correctly", async () => {
    render(
      <BrowserRouter future={routerFutureConfig}>
        <Login />
      </BrowserRouter>,
    );

    // Check if the form elements are rendered
    expect(screen.getByText("Login to Budget Manager")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  test("submits form with username and password", async () => {
    authService.login.mockResolvedValueOnce({});

    render(
      <BrowserRouter future={routerFutureConfig}>
        <Login />
      </BrowserRouter>,
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "testpassword" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    // Check if login was called with correct values
    expect(authService.login).toHaveBeenCalledWith("testuser", "testpassword");

    // Wait for the navigation to happen after the async login completes
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("shows error when login fails", async () => {
    // Mock login function to reject with an error
    authService.login.mockRejectedValueOnce({ error: "Invalid credentials" });

    render(
      <BrowserRouter future={routerFutureConfig}>
        <Login />
      </BrowserRouter>,
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpassword" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  test("button changes to loading state during submission", async () => {
    // Mock login with a delay to test loading state
    authService.login.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100)),
    );

    render(
      <BrowserRouter future={routerFutureConfig}>
        <Login />
      </BrowserRouter>,
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "testpassword" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    // Check if button text changes to "Logging in..."
    expect(
      screen.getByRole("button", { name: /logging in/i }),
    ).toBeInTheDocument();

    // Wait for the login to complete
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith(
        "testuser",
        "testpassword",
      );
    });
  });
});
