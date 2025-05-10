import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import authService from "../../services/authService";

import { Navigate } from "react-router-dom";

// Mock the authService
jest.mock("../../services/authService", () => ({
  isLoggedIn: jest.fn(),
}));

// Mock React Router's Navigate component
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    Navigate: jest.fn(() => null), // Return null for the Navigate component
  };
});

// React Router future flags configuration
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders children when user is authenticated", async () => {
    // Mock that the user is logged in
    authService.isLoggedIn.mockReturnValue(true);

    render(
      <BrowserRouter future={routerFutureConfig}>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );

    // Check that protected content is rendered
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  test("redirects to login when user is not authenticated", async () => {
    // Mock that the user is not logged in
    authService.isLoggedIn.mockReturnValue(false);

    render(
      <BrowserRouter future={routerFutureConfig}>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );

    // Protected content should not be in the document
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();

    // Navigate component should have been called - we don't test the exact arguments,
    // just verify it was called at least once and check the first argument's properties
    expect(Navigate).toHaveBeenCalled();
    expect(Navigate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        to: "/login",
        replace: true,
      }),
    );
  });
});
