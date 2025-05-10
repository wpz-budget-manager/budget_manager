import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Register from "../../components/Register";
import authService from "../../services/authService";

// Mock the authService
jest.mock("../../services/authService", () => ({
  register: jest.fn(),
  login: jest.fn(), // Add mock for login since the component calls both
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

describe("Register Component", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test("renders registration form correctly", async () => {
    await act(async () => {
      render(
        <BrowserRouter future={routerFutureConfig}>
          <Register />
        </BrowserRouter>,
      );
    });

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

  test("submits form with user details", async () => {
    // Setup successful registration and login
    authService.register.mockResolvedValueOnce({});
    authService.login.mockResolvedValueOnce({});

    await act(async () => {
      render(
        <BrowserRouter future={routerFutureConfig}>
          <Register />
        </BrowserRouter>,
      );
    });

    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Username"), {
        target: { value: "testuser" },
      });

      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });

      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "testpassword" },
      });

      fireEvent.change(screen.getByLabelText("Confirm Password"), {
        target: { value: "testpassword" },
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    });

    // Check if register was called with correct values
    expect(authService.register).toHaveBeenCalledWith(
      "testuser",
      "test@example.com",
      "testpassword",
      "testpassword",
    );

    // Check that login was called after registration
    expect(authService.login).toHaveBeenCalledWith("testuser", "testpassword");

    // Wait for the navigation to dashboard (correct behavior from the component)
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("shows error when passwords do not match", async () => {
    await act(async () => {
      render(
        <BrowserRouter future={routerFutureConfig}>
          <Register />
        </BrowserRouter>,
      );
    });

    // Fill in the form with mismatched passwords
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Username"), {
        target: { value: "testuser" },
      });

      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });

      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "testpassword" },
      });

      fireEvent.change(screen.getByLabelText("Confirm Password"), {
        target: { value: "differentpassword" },
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    });

    // Check if error message is displayed
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
  });

  test("shows error when registration fails", async () => {
    // Mock register function to reject with an error
    authService.register.mockRejectedValueOnce({
      response: {
        data: {
          error: "Registration failed",
        },
      },
    });

    await act(async () => {
      render(
        <BrowserRouter future={routerFutureConfig}>
          <Register />
        </BrowserRouter>,
      );
    });

    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Username"), {
        target: { value: "existinguser" },
      });

      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });

      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "testpassword" },
      });

      fireEvent.change(screen.getByLabelText("Confirm Password"), {
        target: { value: "testpassword" },
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    });

    // Check if error message is displayed - updated to match actual error message in component
    await waitFor(() => {
      expect(
        screen.getByText("Registration failed. Please try again."),
      ).toBeInTheDocument();
    });
    expect(mockedNavigate).not.toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
  });

  test("button changes to loading state during submission", async () => {
    // Mock register with a delay to test loading state
    authService.register.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100)),
    );
    // Also mock login since it's called after successful registration
    authService.login.mockResolvedValueOnce({});

    await act(async () => {
      render(
        <BrowserRouter future={routerFutureConfig}>
          <Register />
        </BrowserRouter>,
      );
    });

    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Username"), {
        target: { value: "testuser" },
      });

      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });

      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "testpassword" },
      });

      fireEvent.change(screen.getByLabelText("Confirm Password"), {
        target: { value: "testpassword" },
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    });

    // Check if button text changes to a loading state
    expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();
    expect(screen.getByText("Creating Account...")).toBeInTheDocument();

    // Wait for the registration to complete
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
    });
  });
});
