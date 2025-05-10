import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import authService from "../services/authService";

// Mock the authService
jest.mock("../services/authService", () => ({
  getCurrentUser: jest.fn(),
  getUserProfile: jest.fn(),
  logout: jest.fn(),
}));

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

describe("Dashboard Component", () => {
  const mockUser = {
    username: "testuser",
    email: "testuser@example.com",
    is_admin: false,
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Default mock implementations
    authService.getCurrentUser.mockReturnValue({ username: "testuser" });
    authService.getUserProfile.mockResolvedValue(mockUser);
  });

  test("renders loading state initially", () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("renders dashboard with user information after loading", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Check if dashboard elements are rendered
    expect(screen.getByText("Budget Manager Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Welcome, testuser")).toBeInTheDocument();
    expect(
      screen.getByText("This is your budget dashboard. You are now logged in!"),
    ).toBeInTheDocument();

    // Check user details
    expect(screen.getByText("Username:")).toBeInTheDocument();
    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("Email:")).toBeInTheDocument();
    expect(screen.getByText("testuser@example.com")).toBeInTheDocument();

    // Check logout button
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  test("redirects to login if no current user", async () => {
    // Mock getCurrentUser to return null (not logged in)
    authService.getCurrentUser.mockReturnValueOnce(null);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    // Should navigate to login
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("handles logout correctly", async () => {
    // Mock logout success
    authService.logout.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Click logout button
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    // Should call logout and navigate to login
    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("handles API error when fetching user data", async () => {
    // Mock API error
    authService.getUserProfile.mockRejectedValueOnce(new Error("API Error"));
    console.error = jest.fn(); // Mock console.error to avoid test output pollution

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    // Should still render the dashboard even if API fails
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(screen.getByText("Budget Manager Dashboard")).toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
