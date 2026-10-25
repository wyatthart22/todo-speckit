/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Register from "../src/views/Register.vue";
import AuthServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

async function fillAndSubmit(wrapper, values) {
  const inputs = wrapper.findAll("input");
  const fields = {
    fName: inputs[0],
    lName: inputs[1],
    email: inputs[2],
    username: inputs[3],
    password: inputs[4],
    confirmPassword: inputs[5],
  };

  for (const [key, value] of Object.entries(values)) {
    await fields[key].setValue(value);
  }

  await wrapper.find("form").trigger("submit.prevent");
  await flushPromises();
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(Register);

      await fillAndSubmit(wrapper, {
        fName: "Jane",
        lName: "Doe",
        email: "notanemail",
        username: "jdoe",
        password: "password123",
        confirmPassword: "password123",
      });

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Register);

      await fillAndSubmit(wrapper, {
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "",
        password: "password123",
        confirmPassword: "password123",
      });

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountWithPlugins(Register);

      await fillAndSubmit(wrapper, {
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
        password: "short",
        confirmPassword: "short",
      });

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(Register);

      await fillAndSubmit(wrapper, {
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
        password: "password123",
        confirmPassword: "password456",
      });

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });
  });
});
