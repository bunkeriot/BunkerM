/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
// icons
import { CheckCircleOutlined, SettingOutlined, BellOutlined, CloudSyncOutlined } from '@ant-design/icons-vue';

interface VersionInfo {
  current_version: string;
  latest_version: string;
  update_available: boolean;
  last_checked: string;
  docker_hub_url?: string;
}

const updateAvailable = ref(false);
const versionInfo = ref(null);
const lastChecked = ref('');
const apiError = ref(false);
const DOCKER_HUB_IMAGE = 'bunkeriot/bunkerm';
const DOCKER_HUB_URL = `https://hub.docker.com/r/${DOCKER_HUB_IMAGE}`;
const DOCKER_HUB_TAGS_URL = `https://hub.docker.com/v2/repositories/${DOCKER_HUB_IMAGE}/tags`;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const CURRENT_VERSION = import.meta.env.VITE_CURRENT_VERSION || 'v1.2.0';

// Compute notification count
const notificationCount = computed(() => {
  return updateAvailable.value ? 1 : 0;
});

// Compare semantic version strings (v1.2.3 format)
function compareVersions(v1: string, v2: string): number {
  // Remove 'v' prefix if present
  const version1 = v1.startsWith('v') ? v1.substring(1) : v1;
  const version2 = v2.startsWith('v') ? v2.substring(1) : v2;
  
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);
  
  console.log('Comparing versions:', v1, v2);
  console.log('Parsed parts:', parts1, parts2);
  
  // Compare major version
  if (parts1[0] !== parts2[0]) {
    const result = parts1[0] - parts2[0];
    console.log('Different major versions, result:', result);
    return result;
  }
  
  // Compare minor version
  if (parts1[1] !== parts2[1]) {
    const result = parts1[1] - parts2[1];
    console.log('Different minor versions, result:', result);
    return result;
  }
  
  // Compare patch version
  if (parts1[2] !== parts2[2]) {
    const result = parts1[2] - parts2[2];
    console.log('Different patch versions, result:', result);
    return result;
  }
  
  // Versions are equal
  console.log('Versions are equal');
  return 0;
}

// Check for updates directly from Docker Hub via a public CORS proxy
async function checkForUpdates() {
    try {
        apiError.value = false;
        console.log('Checking for updates, current version:', CURRENT_VERSION);
        
        // Try to fetch from Docker Hub using a CORS proxy
        let data;
        let proxyError = false;
        
        try {
            // Use a different CORS proxy service
            const corsProxyUrl = 'https://api.allorigins.win/raw?url=';
            const encodedUrl = encodeURIComponent(`https://hub.docker.com/v2/repositories/${DOCKER_HUB_IMAGE}/tags`);
            const response = await fetch(`${corsProxyUrl}${encodedUrl}`);
            
            if (response.ok) {
                data = await response.json();
                console.log('Successfully fetched data from Docker Hub via proxy');
            } else {
                console.error('CORS proxy returned status:', response.status);
                proxyError = true;
            }
        } catch (error) {
            console.error('CORS proxy failed:', error);
            proxyError = true;
        }
        
        // If the proxy failed, try to use cached data
        if (proxyError) {
            console.log('Using cached data due to proxy error');
            const cached = localStorage.getItem('dockerHubCheck');
            if (cached) {
                const { data: cachedData } = JSON.parse(cached);
                if (cachedData) {
                    // Just update the last checked time but keep the cached data
                    lastChecked.value = new Date().toLocaleString();
                    apiError.value = true;
                    return;
                }
            }
            
            // If no cached data, show error
            apiError.value = true;
            return;
        }
        
        // Find the latest version tag
        let latestVersion = CURRENT_VERSION;
        if (data.results && data.results.length > 0) {
            // Filter for version tags (starting with 'v')
            const versionTags = data.results
                .filter((tag: { name: string }) => tag.name.startsWith('v'))
                .map((tag: { name: string }) => tag.name);
            
            console.log('Available version tags:', versionTags);
            
            // Sort tags by version number (descending)
            versionTags.sort((a: string, b: string) => compareVersions(b, a));
            
            console.log('Sorted version tags:', versionTags);
            
            // Get the latest version
            if (versionTags.length > 0) {
                latestVersion = versionTags[0];
                console.log('Latest version from Docker Hub:', latestVersion);
            }
        }
        
        // Check if update is available
        const updateDetected = compareVersions(latestVersion, CURRENT_VERSION) > 0;
        console.log('Update available?', updateDetected);
        
        updateAvailable.value = updateDetected;
        versionInfo.value = {
            current_version: CURRENT_VERSION,
            latest_version: latestVersion,
            update_available: updateDetected,
            last_checked: new Date().toISOString(),
            docker_hub_url: DOCKER_HUB_URL
        };
        
        lastChecked.value = new Date().toLocaleString();
        
        // Save the current check data
        localStorage.setItem('dockerHubCheck', JSON.stringify({
            timestamp: Date.now(),
            latestVersion: latestVersion,
            data: versionInfo.value
        }));
    } catch (error) {
        apiError.value = true;
        console.error('Failed to check for updates:', error);
    }
}

// Open Docker Hub URL
function openDockerHub() {
    window.open(DOCKER_HUB_URL, '_blank');
}

// Initialize and set up checks
onMounted(() => {
    console.log('Component mounted, current version:', CURRENT_VERSION);
    
    // Try to get cached version info
    try {
        const cached = localStorage.getItem('dockerHubCheck');
        if (cached) {
            const { timestamp, latestVersion, data } = JSON.parse(cached);
            console.log('Found cached data:', { timestamp, latestVersion, data });
            
            // Only use cache if it's less than a day old
            if (Date.now() - timestamp < CACHE_DURATION_MS) {
                // Re-check if update is available based on current version
                // This handles the case where the app was updated but the cache still exists
                const updateDetected = compareVersions(latestVersion, CURRENT_VERSION) > 0;
                console.log('Re-evaluated update status based on current version:', updateDetected);
                
                updateAvailable.value = updateDetected;
                versionInfo.value = {
                    ...data,
                    current_version: CURRENT_VERSION,
                    update_available: updateDetected
                };
                lastChecked.value = new Date(data.last_checked).toLocaleString();
            } else {
                // Cache expired, check for updates
                console.log('Cache expired, checking for updates');
                checkForUpdates();
            }
        } else {
            // No cache, check for updates
            console.log('No cache found, checking for updates');
            checkForUpdates();
        }
    } catch (e) {
        console.error('Error loading cached version info:', e);
        checkForUpdates();
    }
    
    // Set up periodic check
    setInterval(checkForUpdates, CACHE_DURATION_MS);
});

function dismissUpdate() {
    updateAvailable.value = false;
    
    // Update the cache to mark this update as seen
    if (versionInfo.value) {
        const updatedInfo = { ...versionInfo.value, update_available: false };
        localStorage.setItem('dockerHubCheck', JSON.stringify({
            timestamp: Date.now(),
            latestVersion: versionInfo.value.latest_version,
            data: updatedInfo
        }));
    } else {
        localStorage.removeItem('dockerHubCheck');
    }
}

// Function to clear the cache and force a fresh check
function clearCacheAndCheck() {
    console.log('Clearing cache and checking for updates');
    localStorage.removeItem('dockerHubCheck');
    checkForUpdates();
}
</script>

<template>
  <v-menu :close-on-content-click="false" offset="6, 0">
    <template v-slot:activator="{ props }">
      <v-btn icon class="text-secondary ml-sm-2 ml-1" color="darkText" rounded="sm" size="small" v-bind="props">
        <v-badge v-if="notificationCount > 0" :content="notificationCount" color="primary" offset-x="-4" offset-y="-5">
          <BellOutlined :style="{ fontSize: '16px' }" />
        </v-badge>
        <BellOutlined v-else :style="{ fontSize: '16px' }" />
      </v-btn>
    </template>
    <v-sheet rounded="md" width="387" class="notification-dropdown">
      <div class="pa-4">
        <div class="d-flex align-center justify-space-between">
          <h6 class="text-subtitle-1 mb-0">Notifications</h6>
          <v-btn
            v-if="updateAvailable"
            variant="text"
            color="success"
            icon
            rounded
            size="small"
            @click="dismissUpdate()"
          >
            <CheckCircleOutlined :style="{ fontSize: '16px' }" />
            <v-tooltip aria-label="tooltip" activator="parent" location="bottom">
              <span class="text-caption">Dismiss</span>
            </v-tooltip>
          </v-btn>
        </div>
      </div>
      <v-divider></v-divider>
      <perfect-scrollbar style="height: calc(100vh - 300px); max-height: 265px">
        <v-list class="py-0" lines="two" aria-label="notification list" aria-busy="true">
          <!-- Version Update Notification -->
          <template v-if="updateAvailable && versionInfo">
            <v-list-item value="update" color="secondary" class="no-spacer py-1" active>
              <template v-slot:prepend>
                <v-avatar size="36" variant="flat" color="lightwarning" class="mr-3 py-2 text-warning">
                  <CloudSyncOutlined />
                </v-avatar>
              </template>
              <div class="d-inline-flex justify-space-between w-100">
                <h6 class="text-subtitle-1 font-weight-regular mb-0">
                  New Version Available!
                </h6>
                <span class="text-caption">{{ lastChecked }}</span>
              </div>
              <p class="text-caption text-medium-emphasis my-0">
                A new version of BunkerM is available: {{ versionInfo.latest_version }} (current: {{ versionInfo.current_version }})
              </p>
              <div class="mt-2">
                <v-btn size="small" color="primary" variant="text" @click="openDockerHub">
                  View on Docker Hub
                </v-btn>
              </div>
            </v-list-item>
          </template>
          
          <!-- API Error Message -->
          <template v-else-if="apiError">
            <v-list-item value="api-error" color="secondary" class="no-spacer py-1">
              <template v-slot:prepend>
                <v-avatar size="36" variant="flat" color="lighterror" class="mr-3 py-2 text-error">
                  <SettingOutlined />
                </v-avatar>
              </template>
              <div class="d-inline-flex justify-space-between w-100">
                <h6 class="text-subtitle-1 font-weight-regular mb-0">
                  Update Check Failed
                </h6>
              </div>
              <p class="text-caption text-medium-emphasis my-0">
                Could not check for updates on Docker Hub. Please try again later.
              </p>
            </v-list-item>
          </template>

          <!-- No Updates Available -->
          <template v-else>
            <v-list-item value="no-updates" color="secondary" class="no-spacer py-1">
              <template v-slot:prepend>
                <v-avatar size="36" variant="flat" color="lightprimary" class="mr-3 py-2 text-primary">
                  <CheckCircleOutlined />
                </v-avatar>
              </template>
              <div class="d-inline-flex justify-space-between w-100">
                <h6 class="text-subtitle-1 font-weight-regular mb-0">
                  No Updates Available
                </h6>
              </div>
              <p class="text-caption text-medium-emphasis my-0">
                You are running the latest version of BunkerM ({{ CURRENT_VERSION }}).
              </p>
            </v-list-item>
          </template>
        </v-list>
      </perfect-scrollbar>
      <v-divider></v-divider>
      <div class="pa-2 text-center">
        <v-btn color="primary" variant="text" @click="checkForUpdates" class="mr-2">Check for Updates</v-btn>
        <v-btn color="error" variant="text" @click="clearCacheAndCheck" size="small">Clear Cache</v-btn>
      </div>
    </v-sheet>
  </v-menu>
</template>

<style lang="scss">
.v-tooltip {
  > .v-overlay__content {
    padding: 2px 6px;
  }
}
</style>
