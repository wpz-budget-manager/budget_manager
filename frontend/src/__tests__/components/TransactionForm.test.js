import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TransactionForm from "../../components/TransactionForm";
import * as authService from "../../services/authService"; // 👈 poprawka

jest.mock("../../services/authService", () => {
  return {
    axiosInstance: {
      get: jest.fn(),
      post: jest.fn(),
    },
  };
});

describe("TransactionForm", () => {
  beforeEach(() => {
    authService.axiosInstance.get.mockResolvedValue({
      data: {
        results: [
          { id: 1, name: "Food" },
          { id: 2, name: "Salary" },
        ],
      },
    });
  });

  test("renders form and submits data", async () => {
    render(<TransactionForm />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText("Food")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "100.00" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "1" },
    });

    authService.axiosInstance.post.mockResolvedValueOnce({});

    fireEvent.click(screen.getByRole("button", { name: "Add Transaction" }));

    await waitFor(() => {
      expect(
        screen.getByText("Transaction added successfully!"),
      ).toBeInTheDocument();
    });
  });
});
