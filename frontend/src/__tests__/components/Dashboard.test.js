import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../../components/Dashboard";

// Poprawny mock authService z default exportem
jest.mock("../../services/authService", () => {
  const getCurrentUser = jest.fn();
  const getUserProfile = jest.fn();
  const logout = jest.fn();
  const axiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
  };

  return {
    __esModule: true,
    default: {
      getCurrentUser,
      getUserProfile,
      logout,
    },
    getCurrentUser,
    getUserProfile,
    logout,
    axiosInstance,
  };
});

import authService, { axiosInstance } from "../../services/authService";

// Mock useNavigate z react-router-dom
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
    jest.clearAllMocks();

    authService.getCurrentUser.mockReturnValue({ username: "testuser" });
    authService.getUserProfile.mockResolvedValue(mockUser);

    axiosInstance.get.mockImplementation((url) => {
      if (url.includes("/api/transactions/")) {
        return Promise.resolve({
          data: {
            results: [
              {
                id: 1,
                amount: "200.00",
                description: "McDonalds",
                date: "2025-05-28",
                category: { name: "Food" },
              },
            ],
          },
        });
      }

      if (url.includes("/api/categories/")) {
        return Promise.resolve({
          data: {
            results: [
              { id: 1, name: "Food" },
              { id: 2, name: "Salary" },
            ],
          },
        });
      }

      return Promise.resolve({ data: {} });
    });
  });

  test("renders dashboard content after loading", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          (text) => text.includes("Welcome") && text.includes("testuser"),
        ),
      ).toBeInTheDocument(),
    );

    expect(screen.getByText("Budget Manager Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Username:")).toBeInTheDocument();
    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("Email:")).toBeInTheDocument();
    expect(screen.getByText("testuser@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  test("redirects to login if no current user", () => {
    authService.getCurrentUser.mockReturnValueOnce(null);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    expect(mockedNavigate).toHaveBeenCalledWith("/login");
  });

  test("handles logout correctly", async () => {
    authService.logout.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          (text) => text.includes("Welcome") && text.includes("testuser"),
        ),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("handles API error when fetching user data", async () => {
    authService.getUserProfile.mockRejectedValueOnce(new Error("API Error"));
    console.error = jest.fn();

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Budget Manager Dashboard")).toBeInTheDocument();
    });

    expect(console.error).toHaveBeenCalled();
  });

  test("fetches and displays recent transactions", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("McDonalds")).toBeInTheDocument();
      expect(screen.getAllByText("200.00 zł")[0]).toBeInTheDocument();
      expect(screen.getByText("Food")).toBeInTheDocument();
    });
  });
});
