<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import {
  emailRules,
  registerPasswordRules,
  requiredNameRules,
  usernameRules,
} from "../config/validation.js";

const router = useRouter();
const form = ref(null);
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const errorMessage = ref("");

const firstNameRules = requiredNameRules("First name");
const lastNameRules = requiredNameRules("Last name");
const confirmPasswordRules = computed(() => [
  (value) => !!value?.trim() || "Confirm password is required.",
  (value) => value === password.value || "Passwords do not match.",
]);

async function submit() {
  errorMessage.value = "";
  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const res = await AuthServices.registerUser({
      fName: fName.value,
      lName: lName.value,
      email: email.value,
      username: username.value,
      password: password.value,
    });
    Utils.setStore("user", res.data);
    await router.push({ name: "home" });
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to create account.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h5 px-0">Create account</v-card-title>
          <v-card-text class="px-0">
            <v-alert v-if="errorMessage" type="error" class="mb-4">
              {{ errorMessage }}
            </v-alert>
            <v-form ref="form" @submit.prevent="submit">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="fName" label="First name" :rules="firstNameRules" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="lName" label="Last name" :rules="lastNameRules" />
                </v-col>
              </v-row>
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                :rules="emailRules"
                autocomplete="email"
              />
              <v-text-field
                v-model="username"
                label="Username"
                :rules="usernameRules"
                autocomplete="username"
              />
              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                :rules="registerPasswordRules"
                autocomplete="new-password"
              />
              <v-text-field
                v-model="confirmPassword"
                label="Confirm password"
                type="password"
                :rules="confirmPasswordRules"
                autocomplete="new-password"
              />
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                class="oc-cta"
                :loading="loading"
                block
              >
                Create account
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="px-0">
            <v-btn color="secondary" variant="text" :to="{ name: 'login' }">
              Already have an account? Sign in
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
