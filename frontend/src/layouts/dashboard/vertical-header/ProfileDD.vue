<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router'; 
// icons
import {
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  LockOutlined,
  CommentOutlined,
  UnorderedListOutlined,
  EditOutlined,
  ProfileOutlined,
  WalletOutlined
} from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';

const tab = ref(null);
const authStore = useAuthStore();
const router = useRouter(); // Add router instance

// Add logout handler
const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push('/auth/login'); // Redirect to login page after logout
  } catch (error) {
    console.error('Logout error:', error);
    // Optionally handle error (show message, etc.)
  }
};
</script>

<template>
  <!-- ---------------------------------------------- -->
  <!-- profile DD -->
  <!-- ---------------------------------------------- -->
  <!-- <div>

    <div class="d-flex align-center pa-5">
      <v-avatar size="32" class="mr-2">
        <img src="@/assets/images/users/avatar-1.png" width="32" alt="Julia" />
      </v-avatar>
      <div>
        <h6 class="text-h6 mb-0">JWT User</h6>
        <p class="text-caption mb-0">UI/UX Designer</p>
      </div>
      <div class="ml-auto">
        <v-btn variant="text" color="primary" rounded="sm" icon size="large" @click="handleLogout">
          <LogoutOutlined :style="{ fontSize: '20px' }" />
        </v-btn>
      </div>
    </div>

    <v-tabs v-model="tab" color="primary" grow>
      <v-tab value="111">
        <UserOutlined class="v-icon--start" /> Profile
      </v-tab>
      <v-tab value="222">
        <SettingOutlined class="v-icon--start" /> Setting
      </v-tab>
    </v-tabs>
    <perfect-scrollbar style="height: calc(100vh - 300px); max-height: 240px">
      <v-window v-model="tab">
        <v-window-item value="111">
          <v-list class="py-0" aria-label="profile list" aria-busy="true">
            <v-list-item color="primary" rounded="0" value="Edit profile">
              <template v-slot:prepend>
                <EditOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>

              <v-list-item-title class="text-h6"> Edit Profile</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="View Profile">
              <template v-slot:prepend>
                <UserOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>

              <v-list-item-title class="text-h6"> View Profile</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Social Profile">
              <template v-slot:prepend>
                <ProfileOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>

              <v-list-item-title class="text-h6"> Social Profile</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Billing">
              <template v-slot:prepend>
                <WalletOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>

              <v-list-item-title class="text-h6"> Billing</v-list-item-title>
            </v-list-item>

            <v-list-item @click="handleLogout" color="secondary" rounded="0">
              <template v-slot:prepend>
                <LogoutOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>

              <v-list-item-title class="text-subtitle-2"> Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-window-item>
        <v-window-item value="222">
          <v-list class="py-0" aria-label="profile list" aria-busy="true">
            <v-list-item color="primary" rounded="0" value="Support">
              <template v-slot:prepend>
                <QuestionCircleOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>

              <v-list-item-title class="text-h6"> Support</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Account">
              <template v-slot:prepend>
                <UserOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>

              <v-list-item-title class="text-h6"> Account settings</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Privacy">
              <template v-slot:prepend>
                <LockOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>

              <v-list-item-title class="text-h6"> Privacy center</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Feedback">
              <template v-slot:prepend>
                <CommentOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>

              <v-list-item-title class="text-h6"> Feedback</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="History">
              <template v-slot:prepend>
                <UnorderedListOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>

              <v-list-item-title class="text-h6"> History</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-window-item>
      </v-window>
    </perfect-scrollbar>
  </div> -->
</template>
