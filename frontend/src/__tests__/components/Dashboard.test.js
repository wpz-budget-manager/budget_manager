import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../../components/Dashboard";
import authService from "../../services/authService";

// Mock the authService
jest.mock("../../services/authService", () => ({
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

// React Router future flags configuration
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

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

  test("renders dashboard content after loading", async () => {
    render(
      <BrowserRouter future={routerFutureConfig}>
        <Dashboard />
      </BrowserRouter>,
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Welcome, testuser")).toBeInTheDocument();
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
      <BrowserRouter future={routerFutureConfig}>
        <Dashboard />
      </BrowserRouter>,
    );

    // Should navigate to login
    expect(mockedNavigate).toHaveBeenCalledWith("/login");
  });

  test("handles logout correctly", async () => {
    // Mock logout success
    authService.logout.mockResolvedValueOnce({});

    render(
      <BrowserRouter future={routerFutureConfig}>
        <Dashboard />
      </BrowserRouter>,
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Welcome, testuser")).toBeInTheDocument();
    });

    // Click logout button
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    // Wait for the logout call to complete
    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
    });

    // Wait for the navigation to login to happen
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/login");
    });

    // Should call logout and navigate to login
    expect(authService.logout).toHaveBeenCalled();
    expect(mockedNavigate).toHaveBeenCalledWith("/login");
  });

  test("handles API error when fetching user data", async () => {
    // Mock API error
    authService.getUserProfile.mockRejectedValueOnce(new Error("API Error"));
    console.error = jest.fn(); // Mock console.error to avoid test output pollution

    render(
      <BrowserRouter future={routerFutureConfig}>
        <Dashboard />
      </BrowserRouter>,
    );

    // Should still render the dashboard even if API fails
    await waitFor(() => {
      expect(screen.getByText("Budget Manager Dashboard")).toBeInTheDocument();
    });
    expect(console.error).toHaveBeenCalled();
  });
});
