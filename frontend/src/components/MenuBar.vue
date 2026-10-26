<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import UserServices from "../services/userServices.js";
import Utils from "../config/utils.js";
import {
  emailRules,
  optionalPasswordRules,
  requiredNameRules,
  usernameRules,
} from "../config/validation.js";

const router = useRouter();
const menuOpen = ref(false);
const logoutLoading = ref(false);
const user = ref(Utils.getStore("user"));

const editDialog = ref(false);
const form = ref(null);
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const saveLoading = ref(false);
const errorMessage = ref("");

const firstNameRules = requiredNameRules("First name");
const lastNameRules = requiredNameRules("Last name");
const confirmPasswordRules = computed(() => [
  (value) => value === password.value || "Passwords do not match.",
]);

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  return [user.value.fName, user.value.lName].filter(Boolean).join(" ");
});

function refreshUser() {
  user.value = Utils.getStore("user");
}

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});

async function logOut() {
  logoutLoading.value = true;

  try {
    await AuthServices.logoutUser();
  } finally {
    Utils.removeItem("user");
    logoutLoading.value = false;
    menuOpen.value = false;
    await router.push({ name: "login" });
  }
}

function fillForm(profile) {
  fName.value = profile?.fName || "";
  lName.value = profile?.lName || "";
  email.value = profile?.email || "";
  username.value = profile?.username || "";
  password.value = "";
  confirmPassword.value = "";
}

async function openEdit() {
  errorMessage.value = "";
  fillForm(user.value);
  editDialog.value = true;

  const userId = user.value?.userId ?? user.value?.id;

  if (!userId) {
    return;
  }

  try {
    const res = await UserServices.getUser(userId);
    fillForm(res.data);
  } catch {
    fillForm(user.value);
  }
}

function cancelEdit() {
  editDialog.value = false;
  errorMessage.value = "";
}

async function saveProfile() {
  errorMessage.value = "";
  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  const userId = user.value?.userId ?? user.value?.id;
  const payload = {
    fName: fName.value,
    lName: lName.value,
    email: email.value,
    username: username.value,
  };

  if (password.value) {
    payload.password = password.value;
  }

  saveLoading.value = true;

  try {
    const res = await UserServices.updateUser(userId, payload);
    const stored = Utils.getStore("user") || {};
    Utils.setStore("user", {
      ...stored,
      userId: res.data.id ?? stored.userId,
      fName: res.data.fName,
      lName: res.data.lName,
      email: res.data.email,
      username: res.data.username,
      role: res.data.role,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    refreshUser();
    editDialog.value = false;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to update profile.";
  } finally {
    saveLoading.value = false;
  }
}
</script>

<template>
  <v-app-bar color="surface" elevation="1">
    <v-app-bar-title>Todo</v-app-bar-title>
    <v-spacer />
    <v-menu v-model="menuOpen" location="bottom end" :close-on-content-click="false" attach>
      <template #activator="{ props }">
        <v-btn icon v-bind="props" aria-label="Open profile">
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </template>
      <v-card min-width="280">
        <v-list>
          <v-list-item :title="displayName">
            <v-list-item-subtitle>{{ user?.username }}</v-list-item-subtitle>
            <v-list-item-subtitle>{{ user?.email }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openEdit">
            Edit Profile
          </v-btn>
        </v-card-actions>
        <v-card-actions>
          <v-btn color="secondary" variant="text" :loading="logoutLoading" @click="logOut">
            Log out
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-dialog v-if="editDialog" v-model="editDialog" max-width="520" attach>
    <v-card>
      <v-card-item>
        <template #title>Edit Profile</template>
      </v-card-item>
      <v-card-text>
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-form ref="form" @submit.prevent="saveProfile">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="fName" label="First name" :rules="firstNameRules" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="lName" label="Last name" :rules="lastNameRules" />
            </v-col>
          </v-row>
          <v-text-field v-model="email" label="Email" type="email" :rules="emailRules" />
          <v-text-field v-model="username" label="Username" :rules="usernameRules" />
          <v-text-field
            v-model="password"
            label="New password"
            type="password"
            :rules="optionalPasswordRules"
            autocomplete="new-password"
          />
          <v-text-field
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            :rules="confirmPasswordRules"
            autocomplete="new-password"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="cancelEdit">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" class="oc-cta" :loading="saveLoading" @click="saveProfile">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
