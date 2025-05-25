import authService from "../../services/authService";

// Mock axios
jest.mock("axios", () => {
  const axiosInstanceMock = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  return {
    create: jest.fn(() => axiosInstanceMock),
    ...axiosInstanceMock,
  };
});

// Get access to the mocked axios instance
const axiosMock = require("axios").create();

describe("Auth Service", () => {
  // Setup localStorage mock
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
      length: Object.keys(store).length,
    };
  })();

  // Save original localStorage
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup localStorage mock
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Reset localStorage mock store
    localStorageMock.clear();
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
    });
  });

  test("register calls API with correct parameters", async () => {
    // Mock getCSRFToken
    axiosMock.get.mockResolvedValueOnce({});

    // Mock register API response
    const mockUser = { username: "testuser", email: "test@example.com" };
    const mockResponse = {
      data: { user: mockUser.username, email: mockUser.email },
    };
    axiosMock.post.mockResolvedValueOnce(mockResponse);

    await authService.register(
      "testuser",
      "test@example.com",
      "password123",
      "password123",
    );

    // Check CSRF call
    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.stringContaining("/csrf"),
    );

    // Check register API call
    expect(axiosMock.post).toHaveBeenCalledWith(
      expect.stringContaining("/register/"),
      expect.objectContaining({
        username: "testuser",
        email: "test@example.com",
        password1: "password123",
        password2: "password123",
      }),
    );

    // Check localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify({ username: mockUser.username, email: mockUser.email }),
    );
  });

  test("login calls API with correct parameters and stores user data", async () => {
    // Mock getCSRFToken
    axiosMock.get.mockResolvedValueOnce({});

    // Mock login API response
    const mockResponse = {
      data: { user: "testuser", email: "test@example.com" },
    };
    axiosMock.post.mockResolvedValueOnce(mockResponse);

    await authService.login("testuser", "password123");

    // Check CSRF call
    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.stringContaining("/csrf"),
    );

    // Check login API call
    expect(axiosMock.post).toHaveBeenCalledWith(
      expect.stringContaining("/login/"),
      expect.objectContaining({
        username: "testuser",
        password: "password123",
      }),
    );

    // Check localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify({ username: "testuser", email: "test@example.com" }),
    );
  });

  test("logout removes user data from localStorage", async () => {
    // Mock logout API response
    axiosMock.post.mockResolvedValueOnce({});

    await authService.logout();

    expect(axiosMock.post).toHaveBeenCalledWith(
      expect.stringContaining("/logout/"),
    );
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("user");
  });

  test("getCurrentUser returns user from localStorage", () => {
    const mockUser = { username: "testuser", email: "test@example.com" };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockUser));

    const result = authService.getCurrentUser();

    expect(result).toEqual(mockUser);
    expect(localStorageMock.getItem).toHaveBeenCalledWith("user");
  });

  test("isLoggedIn returns true when user exists in localStorage", () => {
    localStorageMock.getItem.mockReturnValueOnce(
      JSON.stringify({ username: "testuser" }),
    );

    const result = authService.isLoggedIn();

    expect(result).toBe(true);
    expect(localStorageMock.getItem).toHaveBeenCalledWith("user");
  });

  test("isLoggedIn returns false when user does not exist in localStorage", () => {
    localStorageMock.getItem.mockReturnValueOnce(null);

    const result = authService.isLoggedIn();

    expect(result).toBe(false);
    expect(localStorageMock.getItem).toHaveBeenCalledWith("user");
  });

  test("getUserProfile calls API with auth token", async () => {
    const mockResponse = {
      data: { username: "testuser", email: "test@example.com" },
    };
    axiosMock.get.mockResolvedValueOnce(mockResponse);

    const result = await authService.getUserProfile();

    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.stringContaining("/user/"),
    );
    expect(result).toEqual(mockResponse.data);
  });
});
