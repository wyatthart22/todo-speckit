<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { loginPasswordRules, usernameRules } from "../config/validation.js";

const router = useRouter();
const form = ref(null);
const username = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

async function submit() {
  errorMessage.value = "";
  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const res = await AuthServices.loginUser({
      username: username.value,
      password: password.value,
    });
    Utils.setStore("user", res.data);
    await router.push({ name: "home" });
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to sign in.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h5 px-0">Sign in</v-card-title>
          <v-card-text class="px-0">
            <v-alert v-if="errorMessage" type="error" class="mb-4">
              {{ errorMessage }}
            </v-alert>
            <v-form ref="form" @submit.prevent="submit">
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
                :rules="loginPasswordRules"
                autocomplete="current-password"
              />
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                class="oc-cta"
                :loading="loading"
                block
              >
                Sign in
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="px-0">
            <v-btn color="secondary" variant="text" :to="{ name: 'register' }">
              Create an account
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
