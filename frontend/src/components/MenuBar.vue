<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const loading = ref(false);
const user = computed(() => Utils.getStore("user"));
const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  return [user.value.fName, user.value.lName].filter(Boolean).join(" ");
});

async function signOut() {
  loading.value = true;

  try {
    await AuthServices.logoutUser();
  } finally {
    Utils.removeItem("user");
    loading.value = false;
    await router.push({ name: "login" });
  }
}
</script>

<template>
  <v-app-bar color="surface" elevation="1">
    <v-app-bar-title>Todo</v-app-bar-title>
    <v-spacer />
    <span class="me-4">{{ displayName }}</span>
    <v-btn color="secondary" variant="text" class="oc-cta" :loading="loading" @click="signOut">
      Sign out
    </v-btn>
  </v-app-bar>
</template>
